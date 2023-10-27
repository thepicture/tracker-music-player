"use strict";

const { spawn } = require("node:child_process");
const Sample = require("./Sample");

const cpus = require("node:os").cpus().length;

module.exports = class Channel {
  static NO_NOTE = -1;
  static BPM_EFFECT = 15;
  static VOLUME_EFFECT = 12;

  #song;
  #note;
  #volume = Sample.DEFAULT_VOLUME;
  #effect;
  #process;
  #isMuted = false;
  #interval;
  #sampleNumber;

  constructor(song) {
    this.#song = song;
  }

  play(note, sampleNumber, effect) {
    this.isPlaying = true;

    this.#note = note;

    const sample =
      this.#song.samples[
        (sampleNumber === 0 ? this.#sampleNumber : sampleNumber) - 1
      ];

    if (sampleNumber) {
      if (this.#sampleNumber !== sampleNumber) {
        this.#volume = sample.volume;
      }

      this.#sampleNumber = sampleNumber;
    }

    if (effect) {
      this.#effect = effect;

      if (this.#effect.type === Channel.VOLUME_EFFECT) {
        this.#volume = this.#effect.parameter;
      } else if (this.#effect.type === Channel.BPM_EFFECT) {
        this.#song.bpm = this.#effect.parameter;
      }
    }

    if (note === Channel.NO_NOTE) {
      return;
    }

    this.#halt();

    if (!this.#sampleNumber) {
      return;
    }

    const buffer = sample.get(this.#volume);

    const frequency = this.#magic(sample.finetune);

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

      this.#interval = setInterval(() => {
        this.#process.stdin.write(sample.getTail());
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

  mute() {
    this.#isMuted = true;
  }

  destroy() {
    this.#halt();
    this.isPlaying = false;
  }

  #halt() {
    this.#process?.stdin.end();
    this.#process?.stdin.destroy();
    this.#process?.stdout.destroy();
    this.#process?.kill("SIGKILL");

    clearInterval(this.#interval);
  }

  #magic(finetune) {
    return Math.floor(
      832 * Math.pow(2, (this.#note - 69 + finetune / 48) / 12) * 16
    );
  }
};
