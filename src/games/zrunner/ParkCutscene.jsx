import { useEffect, useRef } from 'react';
import { PLAYER_SHEET } from './player.js';
import './ParkCutscene.css';

// Välianimaatio metrosta puistoon: juna pysähtyy pääteasemalle, ovet aukeavat ja pelaaja
// juoksee portaat ylös. Kamera nousee asemalta maan pinnalle, jossa pelaaja tulee ulos
// metron uloskäynnistä yöhön puistoon. Pensaissa syttyy silmäpareja, sitten maailman nimi.
// Kuva on kaksi kerrosta päällekkäin (pinta y 0–900, asema y 900–1800); kamera näyttää
// ensin aseman ja nousee sitten pinnalle. Ajoitukset ovat ParkCutscene.css:ssä.
const DURATION = 9000;

// Juoksurivi pelaajan sprite-arkista (player.js: run = rivi 3, 12 ruutua)
const RUN_ROW = 3;
const RUN_FRAMES = 12;
const SCALE = 0.8;

// Portaat aseman lattiasta (x 700, y 1700) maan pinnalle (x 1500, y 900): 16 askelmaa,
// kukin 50 yksikköä oikealle ja ylös (sama askel kuin CSS:n zr-pk-climb-liikkeessä)
const STEP = 50;
const STEPS = Array.from({ length: 16 }, (_, i) => ({ x: 700 + i * STEP, y: 1700 - (i + 1) * STEP }));

// Kaukaisen kaupungin talot pinnalla: [x, leveys, korkeus]
const SKYLINE = [
  [0, 120, 230], [130, 90, 160], [230, 140, 280], [380, 100, 190], [490, 160, 250],
  [660, 110, 170], [780, 130, 300], [920, 100, 210], [1030, 150, 260], [1190, 120, 180],
  [1320, 140, 240], [1470, 130, 200],
];

// Puiden siluetit: [x, latvuksen säde, korkeus]
const TREES = [
  [120, 90, 330], [380, 70, 260], [640, 100, 360], [900, 80, 290], [1180, 95, 340],
];

// Pensaissa syttyvät silmät: [x, y, viive s]
const EYES = [
  [300, 860, 6.4], [560, 870, 6.8], [820, 855, 6.6], [1080, 865, 7.0],
];

export default function ParkCutscene({ number, worldName, onDone }) {
  const skipRef = useRef(null);

  useEffect(() => {
    // Vähennä liikettä: animaatio ohitetaan kokonaan
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return undefined;
    }
    skipRef.current?.focus({ preventScroll: true });
    const timer = setTimeout(onDone, DURATION);
    return () => clearTimeout(timer);
  }, [onDone]);

  const s = PLAYER_SHEET;
  return (
    <div className="zr-pk" role="region" aria-label={`Siirrytään: ${worldName}`}>
      <div className="zr-pk-world">
        <svg className="zr-pk-scene" viewBox="0 0 1600 1800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="zr-pk-sky" x1="0" y1="0" x2="0" y2="1">
              <stop className="zr-pk-sky-top" offset="0" />
              <stop className="zr-pk-sky-low" offset="1" />
            </linearGradient>
            <radialGradient id="zr-pk-lamp">
              <stop className="zr-pk-lamp-in" offset="0" />
              <stop className="zr-pk-lamp-out" offset="1" />
            </radialGradient>
          </defs>

          {/* ── Pinta: yötaivas, kuu, kaupunki kaukana, puisto ── */}
          <rect x="0" y="0" width="1600" height="900" fill="url(#zr-pk-sky)" />
          <circle className="zr-pk-moon" cx="1260" cy="190" r="70" />
          <g className="zr-pk-city">
            {SKYLINE.map(([x, w, h]) => (
              <rect key={x} x={x} y={900 - h} width={w} height={h} />
            ))}
          </g>
          <g className="zr-pk-trees">
            {TREES.map(([x, r, h]) => (
              <g key={x}>
                <rect x={x - 10} y={900 - h + r * 0.6} width="20" height={h - r * 0.6} />
                <circle cx={x} cy={900 - h} r={r} />
                <circle cx={x - r * 0.6} cy={900 - h + r * 0.4} r={r * 0.7} />
                <circle cx={x + r * 0.6} cy={900 - h + r * 0.3} r={r * 0.75} />
              </g>
            ))}
          </g>
          {/* Katulamppu valokehineen */}
          <circle cx="1020" cy="700" r="110" fill="url(#zr-pk-lamp)" />
          <rect className="zr-pk-post" x="1016" y="700" width="8" height="200" />
          <rect className="zr-pk-bulb" x="1004" y="692" width="32" height="10" rx="4" />
          {/* Pensaat, joista zombien silmät tuijottavat */}
          <g className="zr-pk-bushes">
            {[260, 520, 790, 1050].map((x) => (
              <g key={x}>
                <circle cx={x} cy="880" r="46" />
                <circle cx={x + 50} cy="886" r="40" />
                <circle cx={x - 40} cy="890" r="34" />
              </g>
            ))}
          </g>
          {EYES.map(([x, y, delay]) => (
            <g key={x} className="zr-pk-eyes" style={{ '--zr-delay': `${delay}s` }}>
              <circle cx={x} cy={y} r="5" />
              <circle cx={x + 16} cy={y} r="5" />
            </g>
          ))}
          <rect className="zr-pk-grass" x="0" y="900" width="1600" height="14" />

          {/* ── Maan alla: multakerros, asema ja juna ── */}
          <rect className="zr-pk-soil" x="0" y="914" width="1600" height="406" />
          <rect className="zr-pk-wall" x="0" y="1320" width="1600" height="380" />
          <rect className="zr-pk-ceiling" x="0" y="1320" width="1600" height="8" />
          {[200, 520, 880, 1240].map((x) => (
            <rect key={x} className="zr-pk-tube" x={x} y="1340" width="140" height="10" rx="5" />
          ))}
          <rect className="zr-pk-floor" x="0" y="1700" width="1600" height="100" />
          <rect className="zr-pk-edge" x="0" y="1700" width="1600" height="8" />

          {/* Portaikon kuilu: vino aukko mullan ja aseman läpi */}
          <polygon className="zr-pk-shaft" points="680,1700 1520,860 1600,860 1600,1000 780,1700" />
          <g className="zr-pk-steps">
            {STEPS.map((st) => (
              <rect key={st.x} x={st.x} y={st.y} width={STEP + 8} height={STEP} />
            ))}
          </g>

          {/* Juna: ovet aukeavat ja pelaaja tulee ulos */}
          <g className="zr-pk-train">
            <rect className="zr-pk-car" x="-80" y="1460" width="720" height="236" rx="18" />
            {[-20, 90, 200, 310].map((x) => (
              <rect key={x} className="zr-pk-window" x={x} y="1510" width="80" height="60" rx="6" />
            ))}
            <rect className="zr-pk-stripe" x="-80" y="1600" width="720" height="8" />
            <rect className="zr-pk-doorway" x="470" y="1500" width="100" height="196" />
            <rect className="zr-pk-door zr-pk-door--l" x="470" y="1500" width="50" height="196" />
            <rect className="zr-pk-door zr-pk-door--r" x="520" y="1500" width="50" height="196" />
          </g>

          {/* Metron uloskäynti pinnalla: katos ja M-kyltti portaiden yläpäässä */}
          <g className="zr-pk-exit">
            <rect className="zr-pk-kiosk" x="1420" y="760" width="180" height="140" />
            <rect className="zr-pk-roof" x="1400" y="740" width="200" height="22" rx="4" />
            <rect className="zr-pk-roof-glow" x="1400" y="758" width="200" height="4" />
            <circle className="zr-pk-sign-ring" cx="1450" cy="690" r="34" />
            <path className="zr-pk-sign-m" d="M1432 708 V674 L1450 694 L1468 674 V708" />
          </g>

          {/* Pelaaja: ulos junasta → portaat ylös → käännös ja juoksu puistoon */}
          <g className="zr-pk-run1">
            <g className="zr-pk-climb">
              <g className="zr-pk-park">
                <g className="zr-pk-flip">
                  <g className="zr-pk-player">
                    <g transform={`translate(${-s.frameWidth * s.originX * SCALE} ${-s.frameHeight * s.originY * SCALE}) scale(${SCALE})`}>
                      <svg width={s.frameWidth} height={s.frameHeight} viewBox={`0 0 ${s.frameWidth} ${s.frameHeight}`} className="zr-pk-frame">
                        <image
                          className="zr-pk-sprite"
                          href={s.file}
                          width={s.frameWidth * s.columns}
                          height={s.frameHeight * 7}
                          y={-s.frameHeight * RUN_ROW}
                          style={{ '--zr-step': `${-s.frameWidth * RUN_FRAMES}px` }}
                        />
                      </svg>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </g>

          {/* Uloskäynnin seinä pelaajan edessä: pelaaja näyttää tulevan ulos sen sisältä */}
          <rect className="zr-pk-kiosk-front" x="1540" y="760" width="60" height="140" />
        </svg>
      </div>

      <div className="zr-pk-card">
        <p className="zr-pk-title">
          Maailma {number} · {worldName}
        </p>
      </div>

      {/* Sama Ohita-nappi kuin muissa animaatioissa (tyyli Intro.css:ssä) */}
      <button ref={skipRef} type="button" className="zr-intro-skip" onClick={onDone}>
        Ohita ›
      </button>
    </div>
  );
}