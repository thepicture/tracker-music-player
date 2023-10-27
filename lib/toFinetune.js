"use strict";

module.exports = ([byte]) => {
  const nibble = byte & 0x0f;
  const isPositive = (nibble & 0x08) === 0;
  const remaining3bits = nibble & 0x07;

  return isPositive ? remaining3bits : -remaining3bits;
};
