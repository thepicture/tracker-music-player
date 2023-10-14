"use strict";

const { spawn } = require("node:child_process");
const { DEFAULT_VOLUME, DEFAULT_C4_PITCH } = require("./enums");

module.exports = class Streamer {
  #ffplay;

  play(
    { buffer, pitch, shouldLoop, volume } = {
      buffer: null,
      pitch: DEFAULT_C4_PITCH,
      shouldLoop: false,
      volume: DEFAULT_VOLUME,
    }
  ) {
    this.#ffplay?.kill();

    this.#ffplay = spawn("ffplay", [
      "-f",
      "s8",
      "-ar",
      pitch,
      "-volume",
      volume,
      "-loop",
      shouldLoop ? 0 : 1,
      "-nodisp",
      "-",
    ]);

    this.#ffplay.stdin.write(buffer);
    this.#ffplay.stdin.end();
  }

  stop() {
    this.#ffplay?.kill();
  }
};
