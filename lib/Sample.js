"use strict";

const Channel = require("./Channel");

module.exports = class Sample {
  sample;
  #volume;
  #loopEnum;
  finetune;
  length;
  loopStart;
  #loopEnd;

  static NO_LOOP = 2 << 0;
  static LOOP = 2 << 1;

  constructor(sample, loopEnum, volume, finetune, length, loopStart, loopEnd) {
    this.sample = sample;
    this.#loopEnum = loopEnum;
    this.#volume = volume ?? 64;
    this.finetune = finetune ?? 0;
    this.length = length;
    this.loopStart = loopStart;
    this.#loopEnd = loopEnd;
  }

  setBuffer(buffer) {
    this.sample = buffer;
  }

  shouldLoop() {
    return this.#loopEnum === Sample.LOOP;
  }
};
