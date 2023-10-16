"use strict";

const { readFileSync } = require("node:fs");
const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const Sample = require("../lib/Sample");
const Channel = require("../lib/Channel");
const { MANUAL_TEST_TIME_IN_MILLISECONDS } = require("../lib/enums");
const { pad } = require("./sounds");
const Song = require("../lib/Song");

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

        sample.play("c4");

        setTimeout(() => {
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should play note at c5 pitch", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad));

        sample.play("c5");

        setTimeout(() => {
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should play two samples at same time", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample1 = new Sample(Buffer.from(pad));

        const sample2 = new Sample(Buffer.from(pad));

        sample1.play("c4");
        sample2.play("c3");

        setTimeout(() => {
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should loop", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad), Sample.LOOP);

        sample.play("c4");

        setTimeout(() => {
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should change volume", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const sample = new Sample(Buffer.from(pad), Sample.LOOP, 50);

        sample.play("c4");

        setTimeout(() => {
          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });
  });

  describe("manual channel", () => {
    if (!process.argv.includes("--sample")) {
      return;
    }

    it("should play channel notes", async () => {
      const expected = true;

      const actual = async () => {
        const samples = [new Sample(Buffer.from(pad), Sample.LOOP)];

        const channel = new Channel(samples);

        channel.play("c4", 0);
        await new Promise((r) => setTimeout(r, 500));
        channel.play("e4", 0);
        await new Promise((r) => setTimeout(r, 500));
        channel.play("c4", 0);
        await new Promise((r) => setTimeout(r, 500));
        channel.play("e4", 0);
        await new Promise((r) => setTimeout(r, 500));

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
      await song.play();

      assert.ok(true);
    });
  });
});

describe("sample", () => {
  it("should play sample", () => {
    const expected = [...pad];
    const getPlayer = (where) => ({
      play: ({ buffer }) => where.push(...buffer),
    });

    const actual = [];
    const sample = new Sample(getPlayer(actual), Buffer.from(pad));

    sample.play("c4");

    assert.deepStrictEqual(actual, expected);
  });
});

describe("song", () => {
  it("should load song details", () => {
    const song = new Song(readFileSync("./assets/example.mod"));

    assert.strictEqual(song.title, "");
    assert.strictEqual(song.samples.length, 31);
    assert.strictEqual(song.patterns.length, 17);
  });
});
