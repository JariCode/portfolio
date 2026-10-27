import './City.css';

// Taustan yökaupunki aloitusnäkymään ja animaatioihin: taivas, kuu, kaksi siluettikerrosta,
// ikkunavalot, violetit neonkyltit ja ajelehtiva sumu. Kaupunki on aina sama (ei satunnaisuutta
// renderöinnissä), joten talot pysyvät paikallaan vaiheesta toiseen.
// Ikkunat ja kyltit saavat luokat, joita animaatiot ohjaavat (esim. intro sammuttaa valot).

// Pieni toistettava satunnaislukugeneraattori: sama siemen antaa saman kaupungin
function random(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Rakennukset: [x, leveys, korkeus]. Ikkunat lasketaan rakennuksen koosta.
function skyline(seed, count, minH, maxH) {
  const r = random(seed);
  const out = [];
  let x = -20;
  for (let i = 0; i < count && x < 1020; i++) {
    const w = 50 + Math.floor(r() * 70);
    const h = minH + Math.floor(r() * (maxH - minH));
    out.push({ x, w, h, spire: r() < 0.22, tank: r() < 0.18 });
    x += w + Math.floor(r() * 14);
  }
  return out;
}

const GROUND = 860;
const FAR = skyline(11, 30, 220, 470);
const NEAR = skyline(29, 30, 140, 360);

// Ikkunat lähimpään kerrokseen: osa keltaisia, harva violetti, osa pimeänä.
// --d porrastaa syttymisen, kun valot palaavat (intro).
const WINDOWS = (() => {
  const r = random(7);
  const out = [];
  for (const b of NEAR) {
    for (let y = GROUND - b.h + 18; y < GROUND - 24; y += 22) {
      for (let x = b.x + 10; x < b.x + b.w - 14; x += 16) {
        const v = r();
        if (v < 0.42) continue;
        out.push({ x, y, warm: v < 0.9, d: Math.round(r() * 1200) / 1000 });
      }
    }
  }
  return out;
})();

const STARS = (() => {
  const r = random(3);
  return Array.from({ length: 70 }, () => ({ x: r() * 1000, y: r() * 520, s: 0.6 + r() * 1.6, d: r() * 4 }));
})();

// Neonkyltit: abstraktit merkit, ei tekstiä (kaupungin "riimut")
function NeonSign({ x, y, h, glyphs, className = '' }) {
  return (
    <g className={`sb-city-neon ${className}`.trim()} transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="34" height={h} rx="4" className="sb-city-neon-glow" />
      <rect x="0" y="0" width="34" height={h} rx="4" className="sb-city-neon-tube" />
      <path d={glyphs} className="sb-city-neon-glyph" />
    </g>
  );
}

export default function City({ className = '' }) {
  return (
    <svg className={`sb-city ${className}`.trim()} viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sb-city-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#07051a" />
          <stop offset=".55" stopColor="#170f3c" />
          <stop offset=".85" stopColor="#2e1c62" />
          <stop offset="1" stopColor="#3a2475" />
        </linearGradient>
        <radialGradient id="sb-city-moon" r=".5">
          <stop offset="0" stopColor="#e9e4ff" stopOpacity=".55" />
          <stop offset=".4" stopColor="#b9a8ff" stopOpacity=".18" />
          <stop offset="1" stopColor="#b9a8ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sb-city-fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9a84e6" stopOpacity="0" />
          <stop offset=".6" stopColor="#9a84e6" stopOpacity=".22" />
          <stop offset="1" stopColor="#9a84e6" stopOpacity=".35" />
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

      {/* Kaukainen kerros: vaaleampi ja sumuinen */}
      <g className="sb-city-far" fill="#1d1447">
        {FAR.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={GROUND - b.h - 40} width={b.w} height={b.h + 40} />
            {b.spire && <path d={`M${b.x + b.w / 2 - 6} ${GROUND - b.h - 40} l6 -60 l6 60z`} />}
          </g>
        ))}
      </g>
      <rect y="520" width="1000" height="360" fill="url(#sb-city-fog)" className="sb-city-fog sb-city-fog--far" />

      {/* Lähikerros: tummat siluetit, katoilla antenneja ja vesitorneja */}
      <g className="sb-city-near" fill="#0c0822">
        {NEAR.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={GROUND - b.h} width={b.w} height={b.h} />
            {b.spire && <path d={`M${b.x + 12} ${GROUND - b.h} v-34 h3 v34z`} />}
            {b.tank && (
              <path d={`M${b.x + b.w - 34} ${GROUND - b.h} v-10 h4 v10z M${b.x + b.w - 18} ${GROUND - b.h} v-10 h4 v10z M${b.x + b.w - 38} ${GROUND - b.h - 10} h28 v-22 a14 6 0 0 0 -28 0z`} />
            )}
          </g>
        ))}
      </g>

      <g className="sb-city-windows">
        {WINDOWS.map((w, i) => (
          <rect
            key={i}
            className={`sb-city-window${w.warm ? '' : ' sb-city-window--violet'}`}
            x={w.x}
            y={w.y}
            width="7"
            height="10"
            style={{ '--d': `${w.d}s` }}
          />
        ))}
      </g>

      {/* Neonkyltit katujen yllä */}
      <NeonSign x={784} y={560} h={170} className="sb-city-neon--main" glyphs="M9 22 l8 -14 l8 14z M17 48 l9 10 l-9 10 l-9 -10z M8 86 h18 M8 94 h18 M17 124 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M9 150 l16 10" />
      <NeonSign x={92} y={640} h={110} glyphs="M9 18 h16 v16 h-16z M17 52 v22 M9 63 h16 M9 92 l16 0 l-8 -10z" />

      {/* Katu ja märkä heijastus */}
      <rect y={GROUND} width="1000" height={1000 - GROUND} fill="#07051a" />
      <rect y={GROUND} width="1000" height="3" fill="#b28cff" opacity=".25" />
      <rect x="760" y={GROUND + 10} width="80" height="90" fill="#b28cff" opacity=".08" className="sb-city-reflection" />

      {/* Lähisumu ajelehtii kadun yllä */}
      <rect x="-200" y="700" width="1400" height="300" fill="url(#sb-city-fog)" className="sb-city-fog sb-city-fog--near" />
    </svg>
  );
}