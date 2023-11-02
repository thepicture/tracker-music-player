"use strict";

module.exports = class Sample {
  static DEFAULT_VOLUME = 64;

  buffer;
  volume;
  length;
  loopEnd;
  finetune;
  loopStart;

  #loopTailCache = {};
  #volumedSampleCache = {};

  constructor({ name, volume, finetune, length, loopStart, loopEnd } = {}) {
    this.name = name;
    this.volume = volume ?? 64;
    this.length = length;
    this.loopEnd = loopEnd;
    this.finetune = finetune ?? 0;
    this.loopStart = loopStart;
  }

  get(volume = 64, pan = 0) {
    let { buffer } = this;

    if (volume && volume !== this.volume) {
      const key = `${this.name}\n${this.volume}`;

      const cached = this.#volumedSampleCache[key];

      const volumedBuffer = cached ?? Buffer.alloc(buffer.length);

      if (!cached) {
        for (let i = 0; i < buffer.length; i += 2) {
          let uint = Math.floor(
            (volume / Sample.DEFAULT_VOLUME) * buffer.readInt16LE(i)
          );

          uint = Math.min(32767, uint);
          uint = Math.max(-32767, uint);

          volumedBuffer.writeInt16LE(uint, i);
        }
      }

      buffer = volumedBuffer;

      this.#volumedSampleCache[key] = volumedBuffer;
    }

    return this.#applyPanIfNeeded(pan, buffer);
  }

  withBuffer(buffer) {
    this.buffer = this.#convert8bitTo16bit(buffer);

    return this;
  }

  shouldLoop() {
    return this.loopEnd !== 1;
  }

  getTail(pan) {
    const key = `${this.name}\n${this.volume}`;

    if (!this.#loopTailCache[key]) {
      this.#loopTailCache[key] = this.buffer.subarray(
        this.loopStart * 4,
        (this.loopStart + this.loopEnd) * 4
      );
    }

    return this.#applyPanIfNeeded(pan, this.#loopTailCache[key]);
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

  #applyPanIfNeeded(pan, buffer) {
    if (pan) {
      const stereoBuffer = Buffer.alloc(buffer.length * 2);

      for (let i = 0; i < buffer.length / 2; i++) {
        const sample = buffer.readInt16LE(i * 2);

        const leftSample = Math.round(sample * (1 - pan));
        const rightSample = Math.round(sample * pan);

        stereoBuffer.writeInt16LE(leftSample, i * 4);
        stereoBuffer.writeInt16LE(rightSample, i * 4 + 2);
      }

      return stereoBuffer;
    }

    return buffer;
  }
};
