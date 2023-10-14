"use strict";

module.exports = class Channel {
  #samples;

  constructor(samples) {
    this.#samples = samples;
  }

  play(note = "c4", sampleIndex) {
    this.#samples[sampleIndex].play(note);
  }
};
