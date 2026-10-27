// Valo ja varjot. Puhtaita funktioita: sama laskenta palvelee piirtoa, valokennojen ja
// sienitarhojen tuotantoa (vaihe 2) ja vartijan repliikkejä.
//
// Koordinaatit ovat ruudukon omia (1 = ruudun leveys): x kasvaa ruudulla oikealle alas,
// y vasemmalle alas. Rakennuksen varjo on sen pohjan ja valon suuntaan siirretyn pohjan
// kupera verho; siirtymä = korkeus × pituuskerroin valon suuntaan.

import { HEIGHT, SIZE } from './buildings.js';

// Vuorokausi kestää DAY sekuntia: ensimmäinen puolisko aurinko, toinen kuu
export const DAY = 40;

// Rakennuksen pohja on hieman ruutua pienempi, jotta talojen väliin jää katua
export const INSET = 0.14;

// Valo hetkellä t (0–1 vuorokaudesta).
//   dir:  varjon suunta ruudukossa (yksikkövektori)
//   len:  varjon pituus korkeusyksikköä kohden (matala valo = pitkä varjo)
//   alpha: varjon tummuus; häipyy, kun valo laskee horisonttiin, jotta suunta ei hyppää
//   s:    valon kulku taivaalla 0–1 (taivaan valopallon paikka)
export function lightAt(t) {
  const sun = t < 0.5;
  const s = sun ? t / 0.5 : (t - 0.5) / 0.5;
  // Varjo kääntyy ruudulla oikealta alas ja vasemmalle: valo kulkee vasemmalta oikealle
  const angle = -Math.PI / 4 + Math.PI * s;
  const elevation = ((12 + 38 * Math.sin(Math.PI * s)) * Math.PI) / 180;
  const fade = Math.min(1, Math.sin(Math.PI * s) * 4);
  return {
    sun,
    s,
    dir: [Math.cos(angle), Math.sin(angle)],
    len: Math.min(3, 1 / Math.tan(elevation)),
    alpha: (sun ? 0.78 : 0.45) * fade,
  };
}

// Kupera verho (Andrew'n monotoninen ketju): varjo on aina kupera monikulmio
function hull(points) {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

// Yhden rakennuksen varjo ruudukon koordinaateissa, tai null jos rakennus on matala
export function shadowOf(type, x, y, light) {
  const h = HEIGHT[type] ?? 0;
  if (h <= 0 || light.alpha <= 0) return null;
  const dx = light.dir[0] * light.len * h;
  const dy = light.dir[1] * light.len * h;
  const a = INSET;
  const b = 1 - INSET;
  const base = [
    [x + a, y + a],
    [x + b, y + a],
    [x + b, y + b],
    [x + a, y + b],
  ];
  return hull(base.concat(base.map(([px, py]) => [px + dx, py + dy])));
}

function inside(poly, px, py) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

// Kaikki varjot ja varjossa olevat ruudut. Ruutu on varjossa, jos sen keskipiste osuu
// jonkin toisen rakennuksen varjoon (oma varjo ei varjosta omaa ruutua).
export function castShadows(grid, light) {
  const shadows = [];
  grid.forEach((type, i) => {
    if (!type) return;
    const poly = shadowOf(type, i % SIZE, Math.floor(i / SIZE), light);
    if (poly) shadows.push({ i, poly });
  });
  const shaded = new Set();
  if (light.alpha > 0.05) {
    for (let i = 0; i < grid.length; i++) {
      const cx = (i % SIZE) + 0.5;
      const cy = Math.floor(i / SIZE) + 0.5;
      if (shadows.some((s) => s.i !== i && inside(s.poly, cx, cy))) shaded.add(i);
    }
  }
  return { shadows, shaded };
}