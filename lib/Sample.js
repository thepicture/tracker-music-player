"use strict";

const Channel = require("./Channel");

module.exports = class Sample {
  #player;
  #sample;
  #volume;
  #loopEnum;
  #finetune;
  length;
  #loopStart;
  #loopEnd;

  static NO_LOOP = 2 << 0;
  static LOOP = 2 << 1;

  constructor(
    player,
    sample,
    loopEnum,
    volume,
    finetune,
    length,
    loopStart,
    loopEnd
  ) {
    this.#player = player;
    this.#sample = sample;
    this.#loopEnum = loopEnum;
    this.#volume = volume ?? 64;
    this.#finetune = finetune ?? 0;
    this.length = length;
    this.#loopStart = loopStart;
    this.#loopEnd = loopEnd;
  }

  play(note, effect) {
    const frequency = 410 * Math.pow(2, (note - 69 - this.#finetune / 64) / 12);

    this.#player.play({
      buffer: note === null ? null : this.#sample,
      pitch: frequency * 16,
      shouldLoop: this.#loopEnum === Sample.LOOP,
      volume: effect?.type === Channel.VOLUME ? effect.parameter : this.#volume,
      loopStart: this.#loopStart,
      loopEnd: this.#loopEnd,
    });
  }

  setBuffer(buffer) {
    this.#sample = buffer;
  }
};
