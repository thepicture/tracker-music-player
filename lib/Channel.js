"use strict";

const { spawn } = require("node:child_process");

module.exports = class Channel {
  static NO_NOTE = -1;
  static BPM_EFFECT = 15;
  static VOLUME_EFFECT = 12;
  static DEFAULT_VOLUME = 64;

  samples = [];

  #ref;
  #note;
  #volume = Channel.DEFAULT_VOLUME;
  #effect;
  #isMuted = false;
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
      }

      if (this.#effect.type === Channel.BPM_EFFECT) {
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

    this.#ref?.process.kill();

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

    const shouldLoop = sample.shouldLoop();
    const loopStart = sample.loopStart;
    const frequency = this.#magic(sample);

    this.#ref = {};

    if (this.#isMuted) {
      return;
    }

    if (shouldLoop) {
      this.#ref.process = spawn("aplay", [
        "-f",
        "S16_LE",
        "-q",
        "-N",
        "-r",
        Math.floor(frequency),
      ]);

      this.#ref.process.stdin.write(buffer);
      this.#ref.process.stdin.on("error", () => {});

      // exit event of spawn is slow and produces silence
      for (let i = 0; i < 128; i++) {
        this.#ref.process.stdin.write(buffer.subarray(loopStart * 2));
      }

      this.#ref.process.stdin.end();
    } else {
      this.#ref.process = spawn("aplay", ["-f", "S16_LE", "-r", frequency]);
      this.#ref.process.stdin.write(buffer);
      this.#ref.process.stdin.end();
    }
  }

  addSample(sample) {
    this.samples.push(sample);
  }

  mute() {
    this.#isMuted = true;
  }

  destroy() {
    this.#ref?.process.kill();
    this.isPlaying = false;
  }

  #magic(sample) {
    return Math.floor(
      410 *
        Math.pow(
          2,
          (this.#note - 69 - sample.finetune / Channel.DEFAULT_VOLUME) / 12
        ) *
        16
    );
  }
};
