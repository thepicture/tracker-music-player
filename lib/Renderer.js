"use strict";

const os = require("node:os");
const colorify = require("./colorify");
const { COLORS } = require("./enums");

module.exports = class Renderer {
  render({ pattern, row, channels }) {
    const none = " ";
    const { columns } = process.stdout;

    const isBeat = !(pattern % 4);

    const patternNumber = `${pattern
      .toString(16)
      .toUpperCase()
      .padStart(2, 0)}`;

    process.stdout.write(
      isBeat ? colorify(COLORS.YELLOW, patternNumber) : patternNumber
    );

    let channelIndex = 0;
    let space = columns - 3;
    let { length: rowLength } = row;

    while (space > 0 && rowLength) {
      const {
        period,
        sampleNumber,
        effect: { type, parameter } = {},
      } = row[channelIndex];

      const isMuted = channels[channelIndex++]?.isMuted;

      const applyMutedColorOrNoop = isMuted
        ? (text) => colorify(COLORS.GRAY, text)
        : (text) => text;

      const periodByte = applyMutedColorOrNoop(
        period
          ? period.toString(16).toUpperCase().padStart(4, 0)
          : " ".repeat(4)
      );
      const formattedSampleNumber = applyMutedColorOrNoop(
        colorify(
          COLORS.BLUE,
          sampleNumber
            ? String(sampleNumber).toUpperCase().padStart(2, none)
            : "  "
        )
      );
      const formattedType = applyMutedColorOrNoop(
        colorify(
          COLORS.MAGENTA,
          type ? type.toString(16).toUpperCase().padStart(2, none)[1] : " "
        )
      );
      const formattedParameter = applyMutedColorOrNoop(
        colorify(
          COLORS.YELLOW,
          parameter ? parameter.toString(16).toUpperCase().padStart(2, 0) : "  "
        )
      );

      process.stdout.write(
        `|${periodByte}${formattedSampleNumber}${formattedType}${formattedParameter}`
      );
      rowLength--;
      space -=
        1 -
        periodByte.length -
        formattedSampleNumber.length -
        formattedType.length -
        formattedParameter.length;
    }

    process.stdout.write("|");
    process.stdout.write(os.EOL);
  }
};
