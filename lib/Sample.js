"use strict";

module.exports = class Sample {
  static NO_LOOP = 2 << 0;
  static LOOP = 2 << 1;

  buffer;
  volume;
  length;
  loopEnd;
  finetune;
  loopStart;

  #loopEnum;

  constructor(
    buffer,
    name,
    loopEnum,
    volume,
    finetune,
    length,
    loopStart,
    loopEnd
  ) {
    this.buffer = this.#convert8bitTo16bit(buffer);
    this.name = name;
    this.#loopEnum = loopEnum;
    this.volume = volume ?? 64;
    this.finetune = finetune ?? 0;
    this.length = length;
    this.loopStart = loopStart;
    this.loopEnd = loopEnd;
  }

  setBuffer(buffer) {
    this.buffer = this.#convert8bitTo16bit(buffer);
  }

  shouldLoop() {
    return this.#loopEnum === Sample.LOOP;
  }

  #convert8bitTo16bit(buffer8bit) {
    if (!buffer8bit) {
      return null;
    }

    const buffer16bit = Buffer.alloc(buffer8bit.length * 2);

    for (let i = 0; i < buffer8bit.length; i++) {
      const eightBitValue = buffer8bit.readInt8(i);
      const sixteenBitValue = eightBitValue << 8;

      buffer16bit.writeInt16LE(sixteenBitValue, i * 2);
    }

    return buffer16bit;
  }
};
