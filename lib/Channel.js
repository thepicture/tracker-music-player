"use strict";

module.exports = class Channel {
  samples = [];
  #sampleNumber;
  #currentPeriod;
  #effect;

  static VOLUME = 12;

  constructor(samples) {
    this.samples = samples ?? [];
  }

  play(period, sampleNumber, effect) {
    if (
      effect?.type === Channel.VOLUME ||
      (this.#sampleNumber !== sampleNumber && sampleNumber)
    ) {
      this.#effect = effect;
    }

    if (period === -1 && !sampleNumber) {
      return;
    }

    this.samples.forEach((s) => s.play(null));

    if (period) {
      this.#currentPeriod = period;
    }

    if (sampleNumber) {
      this.#sampleNumber = sampleNumber;

      this.samples[sampleNumber - 1].play(
        period ?? this.#currentPeriod,
        effect ?? this.#effect
      );

      return;
    }

    this.samples[this.#sampleNumber - 1].play(
      period ?? this.#currentPeriod,
      this.#effect
    );
  }

  addSample(sample) {
    this.samples.push(sample);
  }
};
