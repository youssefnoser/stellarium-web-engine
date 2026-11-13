// SVG attributes must serialize identically in server and browser JS engines.
// Sub-pixel precision is sufficient; raw trig doubles can differ in their last bits.
export function svgNumber(value: number): string { return value.toFixed(4); }
