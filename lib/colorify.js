"use strict";

const { COLORS } = require("./enums");

module.exports = (color, text) => `${color}${text}${COLORS.RESET}`;
