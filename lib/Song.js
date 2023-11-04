"use strict";

const os = require("node:os");
const events = require("node:events");
const readline = require("node:readline");
const toNote = require("./toNote");
const Sample = require("./Sample");
const Channel = require("./Channel");
const { COLORS } = require("./enums");
const colorify = require("./colorify");
const toFinetune = require("./toFinetune");

module.exports = class Song extends events.EventEmitter {
  #id;
  #bytes;
  #shouldUpdate = false;
  #channels = [];
  #patterns = [];
  #cachedNotes = {};
  #restartByte;
  #channelCount;
  #patternPlaySequences;

  j = 0;
  i = 0;

  bpm = 125;
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

    this.#configureControls();
  }

  async play() {
    this.isPlaying = true;

    const channels = this.#channels;

    while (this.isPlaying) {
      for (; this.i < this.patterns.length; ) {
        const patternIndex = this.#patternPlaySequences[this.i];

        const pattern = this.#patterns[patternIndex];

        for (; this.j < pattern.length; this.j += channels.length) {
          if (this.isPlaying) {
            this.#render({
              pattern: this.j / channels.length,
              row: pattern.slice(this.j, this.j + channels.length),
            });
          } else {
            this.#destroyChannels();

            return;
          }
          console.log(this.i);

          if (this.#shouldUpdate) {
            this.j = this.i * pattern.length;

            this.#destroyChannels();

            break;
          }

          process.nextTick(() => {
            for (let k = 0; k < channels.length; k++) {
              const { sampleNumber, period, effect } =
                pattern[k + this.j] ?? {};

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
          this.i++;
        }

        this.#shouldUpdate = false;

        this.j = 0;
      }

      this.i = this.#restartByte ?? 0;
    }
  }

  stop() {
    this.isPlaying = false;
  }

  #destroyChannels() {
    for (const channel of this.#channels) {
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

  #render({ pattern, row }) {
    const none = " ";
    const { columns } = process.stdout;

    const isBeat = !(pattern % 4);

    const patternNumber = `${pattern
      .toString(16)
      .toUpperCase()
      .padStart(2, 0)}`;

    process.stdout.write(
      isBeat ? colorify(COLORS.YELLOW, patternNumber) : patternNumber
    );

    let channelIndex = 0;
    let space = columns - 3;
    let { length: rowLength } = row;

    while (space > 0 && rowLength) {
      const {
        period,
        sampleNumber,
        effect: { type, parameter } = {},
      } = row[channelIndex];

      const isMuted = this.#channels[channelIndex++]?.isMuted;

      const applyMutedColorOrNoop = isMuted
        ? (text) => colorify(COLORS.GRAY, text)
        : (text) => text;

      const periodByte = applyMutedColorOrNoop(
        period
          ? period.toString(16).toUpperCase().padStart(4, 0)
          : " ".repeat(4)
      );
      const formattedSampleNumber = applyMutedColorOrNoop(
        colorify(
          COLORS.BLUE,
          sampleNumber
            ? String(sampleNumber).toUpperCase().padStart(2, none)
            : "  "
        )
      );
      const formattedType = applyMutedColorOrNoop(
        colorify(
          COLORS.MAGENTA,
          type ? type.toString(16).toUpperCase().padStart(2, none)[1] : " "
        )
      );
      const formattedParameter = applyMutedColorOrNoop(
        colorify(
          COLORS.YELLOW,
          parameter ? parameter.toString(16).toUpperCase().padStart(2, 0) : "  "
        )
      );

      process.stdout.write(
        `|${periodByte}${formattedSampleNumber}${formattedType}${formattedParameter}`
      );
      rowLength--;
      space -=
        1 -
        periodByte.length -
        formattedSampleNumber.length -
        formattedType.length -
        formattedParameter.length;
    }

    process.stdout.write("|");
    process.stdout.write(os.EOL);
  }

  #parseSamples() {
    this.samples.forEach((sample) => {
      sample.withBuffer(Buffer.from(this.#readByte(sample.length * 2)));
    });
  }

  #initChannels() {
    if (this.enableAmigaPanning) {
      this.#channels = Array(this.#channelCount)
        .fill()
        .map((_, index) => new Channel(this, (1 / this.#channelCount) * index));

      return;
    }

    this.#channels = Array(this.#channelCount)
      .fill()
      .map(() => new Channel(this));
  }

  #cacheNotes() {
    this.#patterns.flat().forEach(({ period }) => {
      this.#cachedNotes[period] = toNote(period);
    });
  }

  #configureControls() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on("keypress", (_, key) => {
      if (!key) {
        return;
      }

      if (key.name === "left") {
        this.bpm--;

        return;
      }

      if (key.name === "right") {
        this.bpm++;

        return;
      }

      if (key.name === "up") {
        this.i--;

        if (this.i < 0) {
          this.i = 0;
        }

        this.#shouldUpdate = true;

        return;
      }

      if (key.name === "down") {
        this.i++;
        this.#shouldUpdate = true;

        return;
      }

      if (key.name === "space") {
        this.isPlaying = !this.isPlaying;

        if (this.isPlaying) {
          this.play();
        }

        return;
      }

      if (key.ctrl && key.name === "c") {
        this.stop();
        this.emit("stop");

        process.stdin.destroy();

        return;
      }

      this.#channels.forEach((channel, index) => {
        if (key.name === String(index + 1)) {
          channel.toggleMute();
          channel.destroy();
        }
      });

      if (key.name === "u") {
        this.#channels.forEach((channel) => channel.unmute());
      }
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
