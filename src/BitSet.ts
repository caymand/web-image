const BIT_VEC_SIZE = 32;

export function getBit(idx: number, bitVec: number) {
  const val = bitVec & (1 << idx);

  return val != 0;
}

/**
 * @returns The expected thing and -1 on an empty bit vector.
 */
export function firstSet(bitVec: number) {
  const clz = Math.clz32(bitVec);
  return (BIT_VEC_SIZE - 1) - clz;
}

/**
 * Strip the bits starting at `from` in the `bitVec`
 */
export function stripBits(from: number, bitVec: number) {
  // bitVec: 
  // 0b 0000 0010 0110 1001
  // from: 7

  // 0b 0000 0000 0111 1111
  const mask = (1 << from) - 1;
  // 0b 0000 0000 0111 1111
  // 0b 0000 0010 0110 1001
  // 0b #### #### #### ####
  // 0b 0000 0000 0110 1001
  return mask & bitVec;
}


export function getSetBits(bitVec: number): Array<number> {
  let idx = firstSet(bitVec);
  const setBits: Array<number> = []

  while (idx >= 0) {
    setBits.push(idx);
    const remaining = stripBits(idx, bitVec);
    idx = firstSet(remaining);
  }

  return setBits;
}