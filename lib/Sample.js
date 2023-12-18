"use strict";

const BYTE_LIMIT = 32767;

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
  #loopDivider = 3;

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

    if (Number.isFinite(volume) && volume !== this.volume) {
      const key = `${this.name}\n${volume}`;

      const cached = this.#volumedSampleCache[key];

      const volumedBuffer = cached ?? Buffer.alloc(buffer.length);

      if (!cached) {
        for (let i = 0; i < buffer.length; i += 2) {
          let uint = Math.floor(
            (volume / Sample.DEFAULT_VOLUME) * buffer.readInt16LE(i)
          );

          uint = Math.min(BYTE_LIMIT, uint);
          uint = Math.max(-BYTE_LIMIT, uint);

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
        this.#getLoopStart(),
        this.#getLoopEnd()
      );
    }

    return this.#applyPanIfNeeded(pan, this.#loopTailCache[key]);
  }

  getTailByteSize(note) {
    return (
      (this.#getLoopEnd() - this.#getLoopStart()) / this.#loopDivider / note
    );
  }

  #getLoopStart() {
    return this.loopStart * 4;
  }

  #getLoopEnd() {
    return (this.loopStart + this.loopEnd) * 4;
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
