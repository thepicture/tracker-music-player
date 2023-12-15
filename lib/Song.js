"use strict";

const { exec } = require("node:child_process");
const { EventEmitter } = require("node:stream");
const toNote = require("./toNote");
const Sample = require("./Sample");
const Channel = require("./Channel");
const toFinetune = require("./toFinetune");
const { PRO_TRACKER_DEFAULT_BPM } = require("./enums");
const Renderer = require("./Renderer");

module.exports = class Song extends EventEmitter {
  #id;
  #bytes;
  #shouldUpdate = false;
  channels = [];
  #patterns = [];
  #cachedNotes = {};
  #restartByte;
  #channelCount;
  #patternPlaySequences;
  isFfplaySupported = true;

  #currentPatternIndex = 0;
  currentRowIndex = 0;

  bpm = PRO_TRACKER_DEFAULT_BPM;
  title;
  samples = [];
  isPlaying = false;

  constructor(buffer, { enableAmigaPanning } = {}) {
    super();

    this.#bytes = [...buffer];

    this.enableAmigaPanning = enableAmigaPanning ?? true;

    this.#parseTitle();
    this.#parseSampleDescriptionRecord();
    this.#parseSongLengthInPatterns();
    this.#parseRestartByteForSongLooping();
    this.#parsePatternPlaySequences();
    this.#parseId();
    this.#parsePatterns();
    this.#parseSamples();

    this.#initChannels();
    this.#cacheNotes();
  }

  async play() {
    await new Promise((resolve) => {
      exec("ffplay", (error) => {
        this.isFfplaySupported = !error;

        resolve();
      });
    });

    this.isPlaying = true;

    const channels = this.channels;

    const renderer = new Renderer();

    while (this.isPlaying) {
      for (; this.#currentPatternIndex < this.patterns.length; ) {
        const patternIndex =
          this.#patternPlaySequences[this.#currentPatternIndex];

        const pattern = this.#patterns[patternIndex];

        for (
          ;
          this.currentRowIndex < pattern.length;
          this.currentRowIndex += channels.length
        ) {
          if (this.isPlaying) {
            renderer.render({
              pattern: this.currentRowIndex / channels.length,
              row: pattern.slice(
                this.currentRowIndex,
                this.currentRowIndex + channels.length
              ),
              channels,
            });
          } else {
            this.#destroyChannels();

            return;
          }

          if (this.#shouldUpdate) {
            this.currentRowIndex = this.#currentPatternIndex * pattern.length;

            this.#destroyChannels();

            break;
          }

          process.nextTick(() => {
            for (let k = 0; k < channels.length; k++) {
              const { sampleNumber, period, effect } =
                pattern[k + this.currentRowIndex] ?? {};

              if (effect?.type === Channel.BPM_EFFECT) {
                this.bpm = effect.parameter;
              }

              channels[k].play(this.#cachedNotes[period], sampleNumber, effect);
            }
          });

          await new Promise((resolve) =>
            setTimeout(resolve, (60 / 4 / this.bpm) * 1000)
          );
        }

        if (!this.#shouldUpdate) {
          this.#currentPatternIndex++;
        }

        this.#shouldUpdate = false;

        this.currentRowIndex = 0;
      }

      this.#currentPatternIndex = this.#restartByte ?? 0;
    }
  }

  stop() {
    this.isPlaying = false;

    this.emit("stop");
  }

  incrementPattern() {
    this.#currentPatternIndex++;
    this.#shouldUpdate = true;
  }

  decrementPattern() {
    this.#currentPatternIndex--;

    if (this.#currentPatternIndex < 0) {
      this.#currentPatternIndex = 0;
    }

    this.#shouldUpdate = true;
  }

  incrementBpm() {
    this.bpm++;
  }

  decrementBpm() {
    this.bpm--;
  }

  togglePlaying() {
    this.isPlaying = !this.isPlaying;

    if (this.isPlaying) {
      this.play();
    }
  }

  #destroyChannels() {
    for (const channel of this.channels) {
      channel.destroy();
    }
  }

  #parseTitle() {
    this.title = this.#readChar(20);
  }

  #parseSampleDescriptionRecord() {
    for (let i = 0; i < 31; i++) {
      const name = this.#readChar(22);
      const length = this.#readWord(1);
      const finetune = toFinetune(this.#readByte(1));
      const [volume] = this.#readByte(1);
      const loopStart = this.#readWord(1);
      const loopEnd = this.#readWord(1);

      this.samples.push(
        new Sample({ name, volume, finetune, length, loopStart, loopEnd })
      );
    }
  }

  #parseSongLengthInPatterns() {
    this.patterns = { length: this.#readByte(1)[0] };
  }

  #parseRestartByteForSongLooping() {
    [this.#restartByte] = this.#readByte(1);
  }

  #parsePatternPlaySequences() {
    this.#patternPlaySequences = this.#readByte(128);
  }

  #parseId() {
    const id = this.#readChar(4);

    if (id === "M.K.") {
      this.#channelCount = 4;

      return;
    }

    if (id === "M!K!") {
      this.#channelCount = 4;

      return;
    }

    if (id === "M&K!") {
      this.#channelCount = 4;

      return;
    }

    if (id.endsWith("CHN")) {
      this.#channelCount = Number(id[0]);

      return;
    }

    if (id === "CD81") {
      this.#channelCount = 8;

      return;
    }

    if (id === "OKTA") {
      this.#channelCount = 8;

      return;
    }

    if (id === "OCTA") {
      this.#channelCount = 8;

      return;
    }

    if (id.endsWith("CH")) {
      this.#channelCount = Number(id.slice(0, 2));

      return;
    }

    if (id.startsWith("TDZ")) {
      this.#channelCount = Number(id.slice(-1));

      return;
    }

    throw new Error(`Id ${this.#id} not supported`);
  }

  #parsePatterns() {
    for (
      let i = 0;
      i < Math.max(...Object.values(this.#patternPlaySequences)) + 1;
      i++
    ) {
      const pattern = [];
      for (let k = 0; k < 64; k++) {
        for (let j = 0; j < this.#channelCount; j++) {
          const bits = this.#toNumber(this.#readByte(4))
            .toString(2)
            .padStart(32, 0);

          const sampleNumber = Number.parseInt(
            bits.slice(0, 4) + bits.slice(16, 20),
            2
          );
          const period = Number.parseInt(bits.slice(4, 16), 2);
          const effect = {
            type: Number.parseInt(bits.slice(20, 24), 2),
            parameter: Number.parseInt(bits.slice(24), 2),
          };

          pattern.push({
            sampleNumber,
            period,
            effect,
          });
        }
      }

      this.#patterns.push(pattern);
    }
  }

  #parseSamples() {
    this.samples.forEach((sample) => {
      sample.withBuffer(Buffer.from(this.#readByte(sample.length * 2)));
    });
  }

  #initChannels() {
    if (this.enableAmigaPanning) {
      this.channels = Array(this.#channelCount)
        .fill()
        .map((_, index) => new Channel(this, (1 / this.#channelCount) * index));

      return;
    }

    this.channels = Array(this.#channelCount)
      .fill()
      .map(() => new Channel(this));
  }

  #cacheNotes() {
    this.#patterns.flat().forEach(({ period }) => {
      this.#cachedNotes[period] = toNote(period);
    });
  }

  #readChar(count) {
    return Buffer.from(this.#bytes.splice(0, count))
      .filter(Boolean)
      .toString("utf8");
  }

  #readWord(count) {
    return this.#toNumber(this.#bytes.splice(0, 2 * count));
  }

  #readByte(count) {
    return this.#bytes.splice(0, count);
  }

  #toNumber(bytes) {
    return Number.parseInt(
      bytes.map((byte) => byte.toString(16).padStart(2, 0)).join(""),
      16
    );
  }
};
