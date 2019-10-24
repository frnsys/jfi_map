function interpolateRange(l, u, p) {
  return l + (u - l) * p;
}

function interpolate(range, p) {
  let [l_r, l_g, l_b] = range[0];
  let [u_r, u_g, u_b] = range[1];
  let r = interpolateRange(l_r, u_r, p);
  let g = interpolateRange(l_g, u_g, p);
  let b = interpolateRange(l_b, u_b, p);
  return [r, g, b];
}

function multiply(a, b) {
  return [a[0]*b[0], a[1]*b[1], a[2]*b[2]];
}

function hexToRGB(hex) {
  let h = parseInt(hex.substr(1), 16);
  return [
    ((h >> 16) & 255)/255,
    ((h >> 8) & 255)/255,
    (h & 255)/255
  ];
}

function colorToRGB(color) {
  return `rgb(${color[0]*255}, ${color[1]*255}, ${color[2]*255})`;
}

function colorToHex(color) {
  let [r,g,b] = color;
  return b*255 | ((g*255) << 8) | ((r*255) << 16);
}

export default {
  interpolate, multiply,
  hexToRGB, colorToRGB, colorToHex
}