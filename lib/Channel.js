"use strict";

const { spawn } = require("node:child_process");

const cpus = require("node:os").cpus().length;

module.exports = class Channel {
  static NO_NOTE = -1;
  static BPM_EFFECT = 15;
  static VOLUME_EFFECT = 12;
  static DEFAULT_VOLUME = 64;

  samples = [];

  #process;
  #note;
  #volume = Channel.DEFAULT_VOLUME;
  #effect;
  #isMuted = false;
  #interval;
  #onBpmChange;
  #sampleNumber;

  constructor(samples, onBpmChange) {
    this.samples = samples ?? [];
    this.#onBpmChange = onBpmChange;
  }

  play(note, sampleNumber, effect) {
    this.isPlaying = true;

    this.#note = note;

    if (sampleNumber) {
      if (this.#sampleNumber !== sampleNumber) {
        this.#volume = Channel.DEFAULT_VOLUME;
      }

      this.#sampleNumber = sampleNumber;
    }

    if (effect) {
      this.#effect = effect;

      if (this.#effect.type === Channel.VOLUME_EFFECT) {
        this.#volume = this.#effect.parameter;
      } else if (this.#effect.type === Channel.BPM_EFFECT) {
        this.#onBpmChange(this.#effect.parameter);
      }
    }

    if (note === Channel.NO_NOTE) {
      return;
    }

    const sample =
      this.samples[
        sampleNumber === 0 ? this.#sampleNumber - 1 : sampleNumber - 1
      ];

    this.#process?.kill();
    clearInterval(this.#interval);

    if (!this.#sampleNumber) {
      return;
    }

    let buffer = sample.sample;

    if (this.#volume !== Channel.DEFAULT_VOLUME && this.#volume) {
      const volumedBuffer = Buffer.alloc(buffer.length);

      for (let i = 0; i < buffer.length; i += 2) {
        let uint = Math.floor(
          (this.#volume / Channel.DEFAULT_VOLUME) * buffer.readInt16LE(i)
        );

        uint = Math.min(32767, uint);
        uint = Math.max(-32767, uint);

        volumedBuffer.writeInt16LE(uint, i);
      }

      buffer = volumedBuffer;
    }

    const frequency = this.#magic();

    if (this.#isMuted) {
      return;
    }

    if (sample.shouldLoop()) {
      this.#process = spawn("ffplay", [
        "-fflags",
        "nobuffer",
        "-flags",
        "low_delay",
        "-probesize",
        32,
        "-strict",
        "experimental",
        "-nodisp",
        "-f",
        "s16le",
        "-loglevel",
        "quiet",
        "-threads",
        cpus,
        "-ar",
        frequency,
        "-",
      ]);

      this.#process.stdin.on("error", () => {});
      this.#process.stdin.write(buffer);

      const subarray = buffer.subarray(sample.loopStart * 4);

      this.#interval = setInterval(() => {
        this.#process.stdin.write(subarray);
      }, 0);
    } else {
      this.#process = spawn("aplay", [
        "-f",
        "S16_LE",
        "-B",
        0,
        "--buffer-size",
        0,
        "-q",
        "-N",
        "-r",
        frequency,
      ]);
      this.#process.stdin.write(buffer);
      this.#process.stdin.end();
    }
  }

  addSample(sample) {
    this.samples.push(sample);
  }

  mute() {
    this.#isMuted = true;
  }

  destroy() {
    this.#process?.kill();
    clearInterval(this.#interval);
    this.isPlaying = false;
  }

  #magic() {
    return Math.floor(832 * Math.pow(2, (this.#note - 69) / 12) * 16);
  }
};
