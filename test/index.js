"use strict";

const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const Sample = require("../lib/Sample");
const Channel = require("../lib/Channel");
const Streamer = require("../lib/Streamer");
const { MANUAL_TEST_TIME_IN_MILLISECONDS } = require("../lib/enums");
const { pad } = require("./sounds");

describe("manual playing", async () => {
  describe("manual sample", () => {
    it("should play note physically", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const streamer = new Streamer();

        const sample = new Sample(streamer, Buffer.from(pad));

        sample.play("c4");

        setTimeout(() => {
          streamer.stop();

          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should play note at c5 pitch", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const streamer = new Streamer();

        const sample = new Sample(streamer, Buffer.from(pad));

        sample.play("c5");

        setTimeout(() => {
          streamer.stop();

          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should play two samples at same time", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const streamer1 = new Streamer();
        const sample1 = new Sample(streamer1, Buffer.from(pad));

        const streamer2 = new Streamer();
        const sample2 = new Sample(streamer2, Buffer.from(pad));

        sample1.play("c4");
        sample2.play("c3");

        setTimeout(() => {
          streamer1.stop();
          streamer2.stop();

          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should loop", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const streamer = new Streamer();
        const sample = new Sample(streamer, Buffer.from(pad), Sample.LOOP);

        sample.play("c4");

        setTimeout(() => {
          streamer.stop();

          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });

    it("should change volume", async () => {
      const expected = true;

      const actual = await new Promise((resolve) => {
        const streamer = new Streamer();
        const sample = new Sample(streamer, Buffer.from(pad), Sample.LOOP, 50);

        sample.play("c4");

        setTimeout(() => {
          streamer.stop();

          resolve(true);
        }, MANUAL_TEST_TIME_IN_MILLISECONDS);
      });

      assert.strictEqual(actual, expected);
    });
  });

  describe("manual channel", () => {
    it("should play channel notes", async () => {
      const expected = true;

      const actual = async () => {
        const streamer = new Streamer();
        const samples = [new Sample(streamer, Buffer.from(pad), Sample.LOOP)];

        const channel = new Channel(samples);

        channel.play("c4", 0);
        await new Promise((r) => setTimeout(r, 500));
        channel.play("e4", 0);
        await new Promise((r) => setTimeout(r, 500));
        channel.play("c4", 0);
        await new Promise((r) => setTimeout(r, 500));
        channel.play("e4", 0);
        await new Promise((r) => setTimeout(r, 500));

        streamer.stop();

        return true;
      };

      assert.strictEqual(await actual(), expected);
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
