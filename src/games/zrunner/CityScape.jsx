import Zombie from './Zombie.jsx';
import './CityScape.css';

// Neonyökaupunki SVG:nä: kolme rakennuskerrosta, kuu, neonkyltit, katulamput, sade,
// sumu ja kadulla laahustavat zombien siluetit. Aloitusnäkymä ja alkuanimaatio
// käyttävät samaa maisemaa; variant="intro" sytyttää valot vaiheittain.

// Siemenellinen satunnaisluku: rakennukset arvotaan kerran moduulin latautuessa ja
// ovat joka kerta samat. Math.random renderöinnissä tekisi maisemasta joka kerta eri.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rakennusrivi: leveys ja korkeus vaihtelevat, ikkunoista osa palaa ja muutama välkkyy
function skyline({ seed, ground, minH, maxH, minW, maxW, win, gap, lit, flicker }) {
  const rand = seeded(seed);
  const buildings = [];
  let x = -40;
  while (x < 1640) {
    const w = Math.round(minW + rand() * (maxW - minW));
    const h = Math.round(minH + rand() * (maxH - minH));
    const top = ground - h;
    const windows = [];
    for (let wy = top + gap * 1.5; wy < ground - gap * 2; wy += win + gap) {
      for (let wx = x + gap; wx < x + w - win - gap / 2; wx += win + gap) {
        const r = rand();
        if (r < lit) {
          windows.push({ x: Math.round(wx), y: Math.round(wy), tone: rand() < 0.25 ? 'b' : 'a', flicker: r < flicker });
        }
      }
    }
    buildings.push({ x, w, h, top, windows, antenna: rand() < 0.3 });
    x += w + Math.round(rand() * 14);
  }
  return buildings;
}

const FAR = skyline({ seed: 7, ground: 640, minH: 180, maxH: 380, minW: 60, maxW: 130, win: 5, gap: 9, lit: 0.32, flicker: 0.01 });
const MID = skyline({ seed: 21, ground: 700, minH: 160, maxH: 330, minW: 90, maxW: 170, win: 8, gap: 12, lit: 0.36, flicker: 0.02 });
const NEAR = skyline({ seed: 42, ground: 760, minH: 120, maxH: 260, minW: 150, maxW: 260, win: 14, gap: 18, lit: 0.42, flicker: 0.04 });

// Sadepisarat: kolme kerrosta eri nopeudella, jokainen kerros liikkuu yhtenä ryhmänä (kevyt piirtää)
const RAIN = [0, 1, 2].map((layer) => {
  const rand = seeded(100 + layer);
  return Array.from({ length: 70 }, () => ({
    x: Math.round(rand() * 1700 - 50),
    y: Math.round(rand() * 900),
    len: Math.round(14 + rand() * 22 + layer * 8),
  }));
});

// Neonkyltit lähimpien rakennusten seinillä (geneerisiä sanoja, ei tavaramerkkejä)
const SIGNS = [
  { x: 150, y: 560, text: 'BAR', tone: 'magenta' },
  { x: 610, y: 600, text: '24H', tone: 'cyan' },
  { x: 1030, y: 545, text: 'HOTEL', tone: 'violet' },
  { x: 1380, y: 590, text: 'OPEN', tone: 'magenta' },
];

// Lamput kylttien väleissä, jotta valokeilat eivät peitä kylttejä
const LAMPS = [440, 880, 1300, 1590];

// Kyltin leveys kirjainmäärän mukaan; teksti sovitetaan kehykseen (textLength)
const signWidth = (text) => text.length * 38 + 32;

function Layer({ buildings, kind }) {
  return (
    <g className={`zr-layer zr-layer--${kind}`}>
      {buildings.map((b) => (
        <g key={b.x}>
          <rect className="zr-building" x={b.x} y={b.top} width={b.w} height={b.h + 200} />
          <rect className="zr-roofline" x={b.x} y={b.top} width={b.w} height="2" />
          {b.antenna && <rect className="zr-building" x={b.x + b.w / 2} y={b.top - 30} width="3" height="30" />}
          {b.antenna && <circle className="zr-beacon" cx={b.x + b.w / 2 + 1.5} cy={b.top - 32} r="3" />}
        </g>
      ))}
      <g className="zr-windows">
        {buildings.flatMap((b) =>
          b.windows.map((w) => (
            <rect
              key={`${w.x}-${w.y}`}
              className={`zr-window zr-window--${w.tone}${w.flicker ? ' zr-window--flicker' : ''}`}
              x={w.x}
              y={w.y}
              width={kind === 'near' ? 14 : kind === 'mid' ? 8 : 5}
              height={kind === 'near' ? 18 : kind === 'mid' ? 10 : 6}
            />
          )),
        )}
      </g>
    </g>
  );
}

export default function CityScape({ variant = 'title' }) {
  return (
    <svg
      className={`zr-city zr-city--${variant}`}
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="zr-sky" x1="0" y1="0" x2="0" y2="1">
          <stop className="zr-sky-top" offset="0" />
          <stop className="zr-sky-mid" offset="0.55" />
          <stop className="zr-sky-low" offset="1" />
        </linearGradient>
        <radialGradient id="zr-horizon" cx="0.5" cy="0.78" r="0.6">
          <stop className="zr-horizon-in" offset="0" />
          <stop className="zr-horizon-out" offset="1" />
        </radialGradient>
        <radialGradient id="zr-halo" cx="0.5" cy="0.5" r="0.5">
          <stop className="zr-halo-in" offset="0.45" />
          <stop className="zr-halo-out" offset="1" />
        </radialGradient>
        <radialGradient id="zr-moon" cx="0.4" cy="0.4" r="0.7">
          <stop className="zr-moon-in" offset="0" />
          <stop className="zr-moon-out" offset="1" />
        </radialGradient>
        <linearGradient id="zr-street" x1="0" y1="0" x2="0" y2="1">
          <stop className="zr-street-top" offset="0" />
          <stop className="zr-street-low" offset="1" />
        </linearGradient>
        <linearGradient id="zr-cone" x1="0" y1="0" x2="0" y2="1">
          <stop className="zr-cone-top" offset="0" />
          <stop className="zr-cone-low" offset="1" />
        </linearGradient>
        <linearGradient id="zr-fog" x1="0" y1="0" x2="0" y2="1">
          <stop className="zr-fog-top" offset="0" />
          <stop className="zr-fog-low" offset="1" />
        </linearGradient>
        <filter id="zr-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="1600" height="900" fill="url(#zr-sky)" />
      <rect width="1600" height="900" fill="url(#zr-horizon)" className="zr-horizon" />

      {/* Kuu ja sen hehku */}
      <g className="zr-moon">
        <circle cx="1240" cy="170" r="150" fill="url(#zr-halo)" />
        <circle cx="1240" cy="170" r="62" fill="url(#zr-moon)" />
        <circle cx="1222" cy="158" r="9" className="zr-moon-crater" />
        <circle cx="1258" cy="190" r="6" className="zr-moon-crater" />
      </g>

      <Layer buildings={FAR} kind="far" />
      <Layer buildings={MID} kind="mid" />
      <Layer buildings={NEAR} kind="near" />

      {/* Neonkyltit */}
      <g filter="url(#zr-glow)">
        {SIGNS.map((s, i) => (
          <g key={s.text} className={`zr-sign zr-sign--${s.tone}`} style={{ '--zr-delay': `${i * 1.7}s` }}>
            <rect x={s.x} y={s.y} width={signWidth(s.text)} height="58" rx="10" className="zr-sign-frame" />
            <text
              x={s.x + signWidth(s.text) / 2}
              y={s.y + 42}
              className="zr-sign-text"
              textLength={signWidth(s.text) - 32}
              lengthAdjust="spacingAndGlyphs"
            >
              {s.text}
            </text>
          </g>
        ))}
      </g>

      {/* Katu ja märän asfaltin heijastukset */}
      <rect y="760" width="1600" height="140" fill="url(#zr-street)" />
      <rect y="760" width="1600" height="3" className="zr-curb" />
      <g className="zr-reflections">
        {SIGNS.map((s) => (
          <rect
            key={s.text}
            x={s.x + 8}
            y="770"
            width={signWidth(s.text) - 16}
            height="110"
            className={`zr-reflection zr-reflection--${s.tone}`}
          />
        ))}
      </g>

      {/* Katulamput valokeiloineen */}
      {LAMPS.map((x) => (
        <g key={x} className="zr-lamp">
          <polygon points={`${x - 6},612 ${x + 6},612 ${x + 70},770 ${x - 70},770`} fill="url(#zr-cone)" className="zr-lamp-cone" />
          <rect x={x - 3} y="600" width="6" height="165" className="zr-lamp-pole" />
          <rect x={x - 16} y="596" width="32" height="8" rx="4" className="zr-lamp-head" />
          <circle cx={x} cy="606" r="5" className="zr-lamp-bulb" filter="url(#zr-glow)" />
        </g>
      ))}

      {/* Sumu kadun yllä, zombien takana */}
      <rect y="690" width="1600" height="140" fill="url(#zr-fog)" className="zr-fog" />

      {/* Zombit laahustavat kadulla */}
      <g className="zr-horde">
        <Zombie x={260} scale={0.9} delay={0} variant="a" />
        <Zombie x={540} scale={1} delay={0.6} variant="kid" />
        <Zombie x={1060} scale={1} delay={1.1} variant="b" flip />
        <Zombie x={1190} scale={0.8} delay={0.3} variant="c" />
      </g>

      {/* Sade */}
      {RAIN.map((drops, layer) => (
        <g key={layer} className={`zr-rain zr-rain--${layer}`}>
          {drops.map((d) => (
            <line key={`${d.x}-${d.y}`} x1={d.x} y1={d.y} x2={d.x - 6} y2={d.y + d.len} />
          ))}
          {drops.map((d) => (
            <line key={`b${d.x}-${d.y}`} x1={d.x} y1={d.y - 900} x2={d.x - 6} y2={d.y - 900 + d.len} />
          ))}
        </g>
      ))}
    </svg>
  );
}