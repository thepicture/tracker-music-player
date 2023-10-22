"use strict";

const { readFileSync } = require("node:fs");
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const Sample = require("../lib/Sample");
const Channel = require("../lib/Channel");
const { MANUAL_TEST_TIME_IN_MILLISECONDS } = require("../lib/enums");
const { pad } = require("./sounds");
const Song = require("../lib/Song");
const toNote = require("../lib/toNote");

describe("manual playing", async () => {
  if (!process.argv.includes("--manual")) {
    return;
  }

  describe("manual sample", () => {
    if (!process.argv.includes("--sample")) {
      return;
    }

    it("should play note physically", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad));
        const channel = new Channel([sample]);

        channel.play(toNote(404), 1);

        setTimeout(() => {
          channel.destroy();
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should play note at c5 pitch", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad));
        const channel = new Channel([sample]);

        channel.play(toNote(202), 1);

        setTimeout(() => {
          channel.destroy();
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should play two samples at same time", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad));

        const channel1 = new Channel([sample]);
        const channel2 = new Channel([sample]);

        channel1.play(toNote(404), 1);
        channel2.play(toNote(808), 1);

        setTimeout(() => {
          channel1.destroy();
          channel2.destroy();
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should loop", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad), Sample.LOOP);

        const channel = new Channel([sample]);
        channel.play(toNote(404), 1);

        setTimeout(() => {
          channel.destroy();
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should change volume", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad), Sample.LOOP);

        const channel = new Channel([sample]);
        channel.play(toNote(404), 1, {
          type: Channel.VOLUME_EFFECT,
          parameter: 32,
        });

        setTimeout(() => {
          channel.destroy();
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });
  });

  describe("manual channel", () => {
    if (!process.argv.includes("--channel")) {
      return;
    }

    it("should play channel notes", async () => {
      const expected = true;

      const actual = async () => {
        const samples = [new Sample(Buffer.from(pad), Sample.LOOP)];

        const channel = new Channel(samples);

        process.nextTick(() => {
          channel.play(toNote(404), 1);
        });
        await new Promise((r) => setTimeout(r, 500));
        process.nextTick(() => {
          channel.play(toNote(360), 1);
        });
        await new Promise((r) => setTimeout(r, 500));
        process.nextTick(() => {
          channel.play(toNote(320), 1);
        });
        await new Promise((r) => setTimeout(r, 500));
        process.nextTick(() => {
          channel.play(toNote(360), 1);
        });
        await new Promise((r) => setTimeout(r, 500));

        channel.destroy();

        return true;
      };

      assert.strictEqual(await actual(), expected);
    });
  });

  describe("playing", () => {
    if (!process.argv.includes("--song")) {
      return;
    }

    it("should play a song", async () => {
      const song = new Song(readFileSync("./assets/example.mod"));
      song.play();

      process.stdin.on("data", () => {
        song.stop();
        assert.ok(!song.isPlaying);

        process.stdin.destroy();
      });
    });
  });
});

describe("sample", () => {
  it("should play sample", () => {
    const expected = true;
    const sample = new Sample(Buffer.from(pad));
    const channel = new Channel([sample]);

    channel.mute();
    channel.play(toNote(404), 1);
    const actual = channel.isPlaying;

    assert.strictEqual(actual, expected);
  });
});
