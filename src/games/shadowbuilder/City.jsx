import './City.css';

// Maisema aloitusnäkymään ja animaatioihin. Kaupunkia ei enää ole: se katosi varjoihin.
// Jäljellä on tyhjä aukea, raunioiden kivijalat, yksinäinen neonkyltti ja maahan hehkuva
// ruudukko, johon pelaaja rakentaa kaupungin uudelleen. Vanha kaupunki näkyy vain muistona
// (haamukaupunki), jonka intro näyttää ja häivyttää; oletuksena se on piilossa.
// Maisema on aina sama (ei satunnaisuutta renderöinnissä).

// Pieni toistettava satunnaislukugeneraattori: sama siemen antaa saman maiseman
function random(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const HORIZON = 620;

// Haamukaupungin talot horisontin päällä
const GHOST = (() => {
  const r = random(29);
  const out = [];
  let x = -20;
  while (x < 1020) {
    const w = 50 + Math.floor(r() * 70);
    const h = 140 + Math.floor(r() * 260);
    out.push({ x, w, h, spire: r() < 0.25 });
    x += w + Math.floor(r() * 14);
  }
  return out;
})();

// Haamukaupungin ikkunat: himmeitä muistoja
const GHOST_WINDOWS = (() => {
  const r = random(7);
  const out = [];
  for (const b of GHOST) {
    for (let y = HORIZON - b.h + 18; y < HORIZON - 24; y += 24) {
      for (let x = b.x + 10; x < b.x + b.w - 14; x += 16) {
        if (r() < 0.5) continue;
        out.push({ x, y });
      }
    }
  }
  return out;
})();

const STARS = (() => {
  const r = random(3);
  return Array.from({ length: 80 }, () => ({ x: r() * 1000, y: r() * 560, s: 0.6 + r() * 1.6, d: r() * 4 }));
})();

// Rakennusruudukko maassa: isometrinen 10 × 10, sama muoto kuin pelin ruudukko
const GRID = { cx: 380, top: 660, hw: 28, hh: 14, n: 10 };
const iso = (gx, gy) => [GRID.cx + (gx - gy) * GRID.hw, GRID.top + (gx + gy) * GRID.hh];
const GRID_LINES = (() => {
  const lines = [];
  for (let i = 1; i < GRID.n; i++) {
    const [ax, ay] = iso(i, 0);
    const [bx, by] = iso(i, GRID.n);
    const [cx, cy] = iso(0, i);
    const [dx, dy] = iso(GRID.n, i);
    lines.push(`M${ax} ${ay} L${bx} ${by}`, `M${cx} ${cy} L${dx} ${dy}`);
  }
  return lines;
})();
const GRID_EDGE = [iso(0, 0), iso(GRID.n, 0), iso(GRID.n, GRID.n), iso(0, GRID.n)].map((p) => p.join(' ')).join(' L');
const GRID_HEART = [iso(4, 4), iso(5, 4), iso(5, 5), iso(4, 5)].map((p) => p.join(' ')).join(' L');

export default function City({ className = '' }) {
  return (
    <svg className={`sb-city ${className}`.trim()} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sb-city-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07051a" />
          <stop offset=".45" stopColor="#150e38" />
          <stop offset=".62" stopColor="#2c1b5e" />
        </linearGradient>
        <linearGradient id="sb-city-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#140d33" />
          <stop offset=".35" stopColor="#0b0722" />
          <stop offset="1" stopColor="#05030f" />
        </linearGradient>
        <radialGradient id="sb-city-moon" r=".5">
          <stop offset="0" stopColor="#e9e4ff" stopOpacity=".55" />
          <stop offset=".4" stopColor="#b9a8ff" stopOpacity=".18" />
          <stop offset="1" stopColor="#b9a8ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sb-city-gridglow" cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#b28cff" stopOpacity=".28" />
          <stop offset="1" stopColor="#b28cff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sb-city-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a84e6" stopOpacity="0" />
          <stop offset=".6" stopColor="#9a84e6" stopOpacity=".2" />
          <stop offset="1" stopColor="#9a84e6" stopOpacity=".32" />
        </linearGradient>
      </defs>

      <rect width="1000" height="1000" fill="url(#sb-city-sky)" />

      <g className="sb-city-stars" fill="#e6dcff">
        {STARS.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s} style={{ '--d': `${s.d}s` }} />
        ))}
      </g>

      {/* Kuu: hillitty hopea, ylhäällä logon ja vartijan valopallon välissä */}
      <circle cx="735" cy="100" r="150" fill="url(#sb-city-moon)" />
      <circle cx="735" cy="100" r="34" fill="#ece8ff" />
      <circle cx="747" cy="91" r="34" fill="#cfc4ff" opacity=".35" />

      {/* Kaukaiset kukkulat ja metsän reuna horisontissa */}
      <path
        d={`M0 ${HORIZON - 40} C120 ${HORIZON - 90} 220 ${HORIZON - 60} 320 ${HORIZON - 70} C430 ${HORIZON - 82} 520 ${HORIZON - 30} 640 ${HORIZON - 58} C760 ${HORIZON - 86} 880 ${HORIZON - 50} 1000 ${HORIZON - 72} V${HORIZON} H0Z`}
        fill="#1c1446"
      />
      <path
        d={`M0 ${HORIZON - 12} l18 -26 l14 20 l16 -34 l18 30 l12 -18 l20 26 l16 -22 l18 24 l14 -14 l22 20 V${HORIZON} H0Z M800 ${HORIZON - 10} l16 -24 l14 18 l18 -30 l16 26 l14 -16 l20 22 l16 -20 l18 24 l20 -12 l18 14 l16 -18 l14 12 V${HORIZON} H800Z`}
        fill="#120c30"
      />

      {/* Haamukaupunki: vanha kaupunki muistona (piilossa, intro näyttää ja häivyttää) */}
      <g className="sb-city-ghost">
        {GHOST.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={HORIZON - b.h} width={b.w} height={b.h} className="sb-city-ghost-house" />
            {b.spire && <path d={`M${b.x + b.w / 2 - 6} ${HORIZON - b.h} l6 -50 l6 50z`} className="sb-city-ghost-house" />}
          </g>
        ))}
        <g className="sb-city-ghost-windows">
          {GHOST_WINDOWS.map((w, i) => (
            <rect key={i} x={w.x} y={w.y} width="7" height="10" />
          ))}
        </g>
      </g>

      {/* Tyhjä aukea */}
      <rect y={HORIZON} width="1000" height={1000 - HORIZON} fill="url(#sb-city-ground)" />
      <rect y={HORIZON} width="1000" height="2" fill="#b28cff" opacity=".18" />

      {/* Raunioiden kivijalat: täällä oli ennen taloja */}
      <g className="sb-city-ruins" fill="#0f0a2a" stroke="#3a2f7a" strokeWidth="1">
        <path d={`M70 ${HORIZON + 26} h70 v-14 h-14 v-10 h-22 v8 h-34z`} />
        <path d={`M210 ${HORIZON + 12} h44 v-22 h-10 v8 h-12 v-14 h-22z`} />
        <path d={`M690 ${HORIZON + 18} h60 v-10 h-18 v-16 h-14 v12 h-28z`} />
        <path d={`M880 ${HORIZON + 34} h80 v-12 h-26 v-8 h-30 v6 h-24z`} />
        <path d={`M560 ${HORIZON + 8} h30 v-12 h-8 v-6 h-22z`} />
      </g>

      {/* Rakennusruudukko: hehkuu maassa, johon kaupunki nousee */}
      <ellipse cx={GRID.cx} cy={GRID.top + GRID.n * GRID.hh} rx="360" ry="150" fill="url(#sb-city-gridglow)" className="sb-city-grid-glow" />
      <g className="sb-city-grid">
        <path d={`M${GRID_EDGE}Z`} className="sb-city-grid-edge" pathLength="1" />
        {GRID_LINES.map((d, i) => (
          <path key={i} d={d} className="sb-city-grid-line" pathLength="1" style={{ '--d': `${(i % 9) * 0.07}s` }} />
        ))}
        {/* Keskimmäinen ruutu: kaupungin ensimmäinen kivi */}
        <path d={`M${GRID_HEART}Z`} className="sb-city-grid-heart" />
      </g>

      {/* Yksinäinen neonkyltti tolpan päässä: ainoa valo, joka jäi */}
      <g className="sb-city-neon sb-city-neon--main" transform="translate(800 470)">
        <path d="M17 150 V300" className="sb-city-post" />
        <rect x="0" y="0" width="34" height="150" rx="4" className="sb-city-neon-glow" />
        <rect x="0" y="0" width="34" height="150" rx="4" className="sb-city-neon-tube" />
        <path d="M9 22 l8 -14 l8 14z M17 46 l9 10 l-9 10 l-9 -10z M8 84 h18 M8 92 h18 M17 118 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M9 134 l16 8" className="sb-city-neon-glyph" />
      </g>
      <ellipse cx="817" cy="772" rx="70" ry="10" fill="#b28cff" opacity=".12" className="sb-city-reflection" />

      {/* Sumu ajelehtii aukean yllä */}
      <rect x="-200" y="520" width="1400" height="200" fill="url(#sb-city-fog)" className="sb-city-fog sb-city-fog--far" />
      <rect x="-200" y="760" width="1400" height="240" fill="url(#sb-city-fog)" className="sb-city-fog sb-city-fog--near" />
    </svg>
  );
}