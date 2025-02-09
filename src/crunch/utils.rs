pub(crate) fn is_power_of_2(x: u32) -> bool {
    x != 0 && ((x & (x - 1)) == 0)
}

pub(crate) fn next_pow2(val: u32) -> u32 {
    let mut val = val;
    val -= 1;
    val |= val >> 16;
    val |= val >> 8;
    val |= val >> 4;
    val |= val >> 2;
    val |= val >> 1;
    val + 1
}

pub(crate) fn floor_log2i(v: u32) -> u32 {
    let mut v = v;
    let mut l: u32 = 0;
    while v > 1 {
        v >>= 1;
        l += 1;
    }
    l
}

pub(crate) fn ceil_log2i(v: u32) -> u32 {
    let mut l = floor_log2i(v);
    if (l != 32) && (v > (1u32 << l)) {
        l += 1;
    }
    l
}

pub(crate) fn total_bits(v: u32) -> u32 {
    let mut v = v;
    let mut l = 0;
    while v > 0 {
        v >>= 1;
        l += 1;
    }
    l
}
