"use strict";

const toNote = require("./toNote");
const Sample = require("./Sample");
const Channel = require("./Channel");

module.exports = class Song {
  #id;
  #bpm = 125;
  #bytes;
  #patterns = [];
  #restartByte;
  #patternPlaySequences;
  #channelsWithSamples = [];

  title;
  samples = [];
  isPlaying = false;

  constructor(buffer) {
    this.#bytes = [...buffer];

    this.#parseTitle();
    this.#parseSampleDescriptionRecord();
    this.#parseSongLengthInPatterns();
    this.#parseRestartByteForSongLooping();
    this.#parsePatternPlaySequences();
    this.#parseId();
    this.#parsePatterns();
    this.#parseSamples();
  }

  async play() {
    this.isPlaying = true;

    const channels = this.#channelsWithSamples;

    let isRestarted = false;

    while (this.isPlaying) {
      for (
        let i = isRestarted ? this.#restartByte : 0;
        i < this.patterns.length;
        i++
      ) {
        const patternIndex = this.#patternPlaySequences[i];

        const pattern = this.#patterns[patternIndex];

        for (let j = 0; j < pattern.length; j += channels.length) {
          process.nextTick(() => {
            for (let k = 0; k < channels.length; k++) {
              if (!this.isPlaying) {
                for (const channel of this.#channelsWithSamples) {
                  channel.destroy();
                }

                return;
              }

              const { sampleNumber, period, effect } = pattern[k + j];

              if (effect?.type === Channel.BPM_EFFECT) {
                this.#bpm = effect.parameter;
              }

              channels[k].play(toNote(period), sampleNumber, effect);
            }
          });

          await new Promise((resolve) =>
            setTimeout(resolve, (60 / 4 / this.#bpm) * 1000)
          );
        }
      }

      isRestarted = true;
    }
  }

  stop() {
    this.isPlaying = false;
  }

  #parseTitle() {
    this.title = this.#readChar(20);
  }

  #parseSampleDescriptionRecord() {
    this.#channelsWithSamples = Array(8)
      .fill(null)
      .map(() => new Channel(null, (bpm) => (this.#bpm = bpm)));

    for (let i = 0; i < 31; i++) {
      this.#readChar(22); // name omitted
      const length = this.#readWord(1);
      const [finetune] = this.#readByte(1);
      const [volume] = this.#readByte(1);
      const loopStart = this.#readWord(1);
      const loopEnd = this.#readWord(1);

      this.#channelsWithSamples.forEach((channel) => {
        channel.addSample(
          new Sample(
            null,
            loopEnd === 1 ? Sample.NO_LOOP : Sample.LOOP,
            volume,
            finetune,
            length,
            loopStart,
            loopEnd
          )
        );
      });
    }

    this.samples = {
      length: this.#channelsWithSamples[0].samples.length,
    };
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
    this.#id = this.#readChar(4);

    if (this.#id !== "8CHN") {
      throw new Error(`Id ${this.#id} not supported`);
    }
  }

  #parsePatterns() {
    for (
      let i = 0;
      i < Math.max(...Object.values(this.#patternPlaySequences)) + 1;
      i++
    ) {
      const pattern = [];
      for (let k = 0; k < 64; k++) {
        for (let j = 0; j < 8; j++) {
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
    this.#channelsWithSamples[0].samples.forEach((sample, index) => {
      const buffer = Buffer.from(this.#readByte(sample.length * 2));

      this.#channelsWithSamples.forEach((channel) => {
        channel.samples[index].setBuffer(buffer);
      });
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
      bytes.map((byte) => byte.toString("16").padStart(2, "0")).join(""),
      16
    );
  }
};
