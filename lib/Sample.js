"use strict";

const {
  DEFAULT_C4_PITCH,
  DEFAULT_SAMPLE_RATE,
  NOTE_NAME_TO_PITCH_MAP,
  DEFAULT_VOLUME,
} = require("./enums");

module.exports = class Sample {
  #player;
  #sample;
  #volume;
  #loopEnum;

  static NO_LOOP = 2 << 0;
  static LOOP = 2 << 1;

  constructor(player, sample, loopEnum, volume = 100) {
    this.#player = player;
    this.#sample = sample;
    this.#volume = volume;
    this.#loopEnum = loopEnum;
  }

  play(note) {
    const frequency = this.#noteToFrequency(note);
    const speedRatio = frequency / DEFAULT_C4_PITCH;
    const pitch = Math.round(DEFAULT_SAMPLE_RATE * speedRatio);

    this.#player.play({
      buffer: this.#sample,
      pitch,
      shouldLoop: this.#loopEnum === Sample.LOOP,
      volume: this.#volume,
    });
  }

  #noteToFrequency(note) {
    const pitchClass = note.slice(0, -1).toLowerCase();
    const octave = parseInt(note.slice(-1));
    const baseFrequency = DEFAULT_C4_PITCH * Math.pow(2, octave - 4);

    return baseFrequency * NOTE_NAME_TO_PITCH_MAP[pitchClass];
  }
};
