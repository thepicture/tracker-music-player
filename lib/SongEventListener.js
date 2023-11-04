"use strict";

const events = require("node:events");
const readline = require("node:readline");

module.exports = class SongEventListener extends events.EventEmitter {
  #song;

  constructor(song) {
    super();

    this.#song = song;
  }

  get channels() {
    return this.#song.channels;
  }

  listen() {
    this.#configureControls();
  }

  #configureControls() {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);

    process.stdin.on("keypress", (_, key) => {
      if (!key) {
        return;
      }

      if (key.name === "left") {
        this.#song.decrementBpm();

        return;
      }

      if (key.name === "right") {
        this.#song.incrementBpm();

        return;
      }

      if (key.name === "up") {
        this.#song.decrementPattern();

        return;
      }

      if (key.name === "down") {
        this.#song.incrementPattern();

        return;
      }

      if (key.name === "space") {
        this.#song.togglePlaying();

        return;
      }

      if (key.ctrl && key.name === "c") {
        this.#song.stop();
        this.emit("stop");

        process.stdin.destroy();

        return;
      }

      this.channels.forEach((channel, index) => {
        if (key.name === String(index + 1)) {
          channel.toggleMute();
          channel.destroy();
        }
      });

      if (key.name === "u") {
        this.channels.forEach((channel) => channel.unmute());
      }
    });
  }
};
