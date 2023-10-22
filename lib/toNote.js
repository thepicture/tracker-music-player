"use strict";

const { PRO_TRACKER_PERIOD_TABLE } = require("./enums");

module.exports = (period) => {
  const NOTE_MIN = 1;

  let note = -1;

  if (period > 0 && period !== 0xfff) {
    note = PRO_TRACKER_PERIOD_TABLE.length + 23 + NOTE_MIN;

    for (let i = 0; i < PRO_TRACKER_PERIOD_TABLE.length; i++) {
      if (period >= PRO_TRACKER_PERIOD_TABLE[i]) {
        if (period !== PRO_TRACKER_PERIOD_TABLE[i] && i !== 0) {
          const p1 = PRO_TRACKER_PERIOD_TABLE[i - 1];
          const p2 = PRO_TRACKER_PERIOD_TABLE[i];

          if (p1 - period < period - p2) {
            note = i + 23 + NOTE_MIN;
            break;
          }
        }
        note = i + 24 + NOTE_MIN;
        break;
      }
    }
  }

  return note;
};
