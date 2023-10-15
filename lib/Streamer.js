"use strict";

const { spawn } = require("node:child_process");
const { DEFAULT_VOLUME, DEFAULT_C4_PITCH } = require("./enums");

module.exports = class Streamer {
  #aplay;
  #looper;

  play(
    { buffer, pitch, shouldLoop, volume, loopStart } = {
      buffer: null,
      pitch: DEFAULT_C4_PITCH,
      shouldLoop: false,
      volume: DEFAULT_VOLUME,
    }
  ) {
    this.stop();

    if (!buffer) {
      return;
    }

    let volumedBuffer = buffer;

    if (volume !== 64) {
      volumedBuffer = new Buffer(buffer.length);

      for (let i = 0; i < buffer.length; i += 2) {
        let uint = Math.floor((volume / 64) * buffer.readInt16LE(i));

        uint = Math.min(32767, uint);
        uint = Math.max(-32767, uint);

        volumedBuffer.writeInt16LE(uint, i);
      }
    }

    this.#aplay = spawn("aplay", ["-f", "S16_LE", "-r", Math.floor(pitch)]);

    if (shouldLoop) {
      let isLoopHead = true;

      this.#looper = setInterval(() => {
        const ref = this.#aplay;
        this.#looper.ref = ref;

        if (ref.stdin.writable) {
          ref.stdin.write(
            isLoopHead
              ? volumedBuffer
              : volumedBuffer.subarray(loopStart * 2, volumedBuffer.length)
          );
        } else {
          ref.kill();
        }

        if (isLoopHead) {
          isLoopHead = false;
        }
      }, 10);
    } else {
      this.#aplay.stdin.write(volumedBuffer);
      this.#aplay.stdin.pause();
      this.#aplay.stdin.end();
    }
  }

  stop() {
    this.#aplay?.stdin.pause();
    this.#aplay?.kill();
    this.#looper?.ref?.kill();
    clearInterval(this.#looper);
  }
};
