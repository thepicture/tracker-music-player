"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const Sample = require("../lib/Sample");
const Streamer = require("../lib/Streamer");
const { MANUAL_TEST_TIME_IN_MILLISECONDS } = require("../lib/enums");
const { pad } = require("./sounds");

describe("manual playing", async () => {
  it("should play note physically", async () => {
    const expected = true;

    const actual = await new Promise((resolve) => {
      const streamer = new Streamer();

      const sample = new Sample(streamer);

      sample.play(Buffer.from(pad), "c4");

      setTimeout(() => {
        streamer.stop();

        return resolve(true);
      }, MANUAL_TEST_TIME_IN_MILLISECONDS);
    });

    assert.strictEqual(actual, expected);
  });

  it("should play note at c5 pitch", async () => {
    const expected = true;

    const actual = await new Promise((resolve) => {
      const streamer = new Streamer();

      const sample = new Sample(streamer);

      sample.play(Buffer.from(pad), "c5");

      setTimeout(() => {
        streamer.stop();

        return resolve(true);
      }, MANUAL_TEST_TIME_IN_MILLISECONDS);
    });

    assert.strictEqual(actual, expected);
  });

  it("should play two samples at same time", async () => {
    const expected = true;

    const actual = await new Promise((resolve) => {
      const streamer1 = new Streamer();
      const sample1 = new Sample(streamer1);

      const streamer2 = new Streamer();
      const sample2 = new Sample(streamer2);

      sample1.play(Buffer.from(pad), "c4");
      sample2.play(Buffer.from(pad), "c3");

      setTimeout(() => {
        streamer1.stop();
        streamer2.stop();

        return resolve(true);
      }, MANUAL_TEST_TIME_IN_MILLISECONDS);
    });

    assert.strictEqual(actual, expected);
  });

  it("should loop", async () => {
    const expected = true;

    const actual = await new Promise((resolve) => {
      const streamer = new Streamer();
      const sample = new Sample(streamer);

      sample.play(Buffer.from(pad), "c4", sample.LOOP);

      setTimeout(() => {
        streamer.stop();

        return resolve(true);
      }, MANUAL_TEST_TIME_IN_MILLISECONDS);
    });

    assert.strictEqual(actual, expected);
  });

  it("should change volume", async () => {
    const expected = true;

    const actual = await new Promise((resolve) => {
      const streamer = new Streamer();
      const sample = new Sample(streamer);

      sample.play(Buffer.from(pad), "c4", sample.LOOP, 50);

      setTimeout(() => {
        streamer.stop();

        return resolve(true);
      }, MANUAL_TEST_TIME_IN_MILLISECONDS);
    });

    assert.strictEqual(actual, expected);
  });
});

describe("sample", () => {
  it("should play sample", () => {
    const expected = [...pad];
    const getPlayer = (where) => ({
      play: ({ buffer }) => where.push(...buffer),
    });

    const actual = [];
    const sample = new Sample(getPlayer(actual));

    sample.play(Buffer.from(pad), "c4");

    assert.deepStrictEqual(actual, expected);
  });
});
