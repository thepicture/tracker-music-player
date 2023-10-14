"use strict";

const {
  DEFAULT_C4_PITCH,
  DEFAULT_SAMPLE_RATE,
  NOTE_NAME_TO_PITCH_MAP,
  DEFAULT_VOLUME,
} = require("./enums");

module.exports = class Sample {
  #player;

  NO_LOOP = 2 << 0;
  LOOP = 2 << 1;

  constructor(player) {
    this.#player = player;
  }

  play(buffer, note, loopEnum = this.NO_LOOP, volume = DEFAULT_VOLUME) {
    const frequency = this.#noteToFrequency(note);
    const speedRatio = frequency / DEFAULT_C4_PITCH;
    const pitch = Math.round(DEFAULT_SAMPLE_RATE * speedRatio);

    this.#player.play({
      buffer,
      pitch,
      shouldLoop: loopEnum === this.LOOP,
      volume,
    });
  }

  #noteToFrequency(note) {
    const pitchClass = note.slice(0, -1).toLowerCase();
    const octave = parseInt(note.slice(-1));
    const baseFrequency = DEFAULT_C4_PITCH * Math.pow(2, octave - 4);

    return baseFrequency * NOTE_NAME_TO_PITCH_MAP[pitchClass];
  }
};
