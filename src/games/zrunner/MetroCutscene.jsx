import { useEffect, useRef } from 'react';
import CityScape from './CityScape.jsx';
import Zombie from './Zombie.jsx';
import { PLAYER_SHEET } from './player.js';
import './MetroCutscene.css';

// Välianimaatio maailmasta 1 metroon: pelaaja juoksee kadulla metron sisäänkäynnille,
// zombit laahustavat perässä. Kamera laskeutuu kadun alle, jolloin näkyy poikkileikkaus
// portaikosta: pelaaja juoksee portaat alas kohti aseman valoa, zombit jäävät ylös.
// Sen jälkeen pimeässä tunnelissa lähestyy junan valot, välähdys ja maailman nimi.
// Sama kaupunkimaisema kuin alkuanimaatiossa, mutta kadun omat zombit piilotetaan (CSS),
// jottei pelaaja juokse niiden läpi. Ajoitukset ovat MetroCutscene.css:ssä.
const DURATION = 9200;

// Juoksurivi pelaajan sprite-arkista (player.js: run = rivi 3, 12 ruutua)
const RUN_ROW = 3;
const RUN_FRAMES = 12;
const SCALE = 0.8;

// Portaikko kadun alla: kahdeksan askelmaa, kukin 28 yksikköä oikealle ja alas
// (sama askel kuin CSS:n zr-cut-descend-liikkeessä)
const STEP = 28;
const STEPS = Array.from({ length: 9 }, (_, i) => ({ x: 1110 + i * STEP, y: 885 + i * STEP }));

// Perässä tulevat zombit: laji, koko ja oma animaatioluokka (eri lähtö ja pysähdyspaikka)
// Kaksi viimeistä pysähtyvät portaikon reunalle tuijottamaan alas
const CHASERS = [
  { variant: 'a', scale: 0.85, delay: 0 },
  { variant: 'kid', scale: 1, delay: 0.25 },
  { variant: 'c', scale: 0.8, delay: 0.5 },
];

export default function MetroCutscene({ number, worldName, onDone }) {
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
    <div className="zr-cut" role="region" aria-label={`Siirrytään: ${worldName}`}>
      <div className="zr-cut-street">
        <CityScape variant="title" />

        {/* Metron sisäänkäynti, pelaaja ja zombit samassa koordinaatistossa kuin kaupunkimaisema */}
        {/* overflow: visible – kadun alapuolinen osa (y > 900) tulee näkyviin, kun kamera laskeutuu */}
        <svg className="zr-cut-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <defs>
            {/* Sisäänkäynnin pimeys syvenee alaspäin: portaat katoavat varjoon */}
            <linearGradient id="zr-cut-depth" x1="0" y1="0" x2="1" y2="1">
              <stop className="zr-cut-depth-top" offset="0" />
              <stop className="zr-cut-depth-low" offset="1" />
            </linearGradient>
          </defs>

          {/* Kadun alla: maaperän poikkileikkaus, portaikon kuilu ja aseman valo pohjalla */}
          <g className="zr-cut-under">
            <rect className="zr-cut-ground" x="-400" y="900" width="2400" height="420" />
            <rect className="zr-cut-ground-edge" x="-400" y="900" width="2400" height="4" />
            <rect x="1100" y="885" width="290" height="300" fill="url(#zr-cut-depth)" />
            <rect className="zr-cut-station" x="1300" y="1090" width="110" height="95" />
            <g className="zr-cut-steps">
              {STEPS.map((st) => (
                <rect key={st.x} x={st.x} y={st.y} width={STEP + 8} height={STEP} />
              ))}
            </g>
          </g>

          <g className="zr-cut-entrance">
            {/* Sisäänkäynnin sisus: pimeä aukko katoksen alla */}
            <rect x="1106" y="652" width="268" height="233" fill="url(#zr-cut-depth)" />
            <rect className="zr-cut-pillar" x="1090" y="650" width="16" height="235" />
            <rect className="zr-cut-pillar" x="1374" y="650" width="16" height="235" />
            <rect className="zr-cut-roof" x="1070" y="628" width="340" height="24" rx="4" />
            <rect className="zr-cut-roof-glow" x="1070" y="648" width="340" height="5" />
            <polygon className="zr-cut-cone" points="1110,653 1370,653 1380,885 1100,885" />
            {/* M-kyltti korkealla tolpan päässä, ettei peitä hotellin kylttiä */}
            <g className="zr-cut-sign">
              <rect className="zr-cut-pillar" x="1286" y="470" width="8" height="160" />
              <circle className="zr-cut-sign-ring" cx="1290" cy="430" r="44" />
              <path className="zr-cut-sign-m" d="M1266 453 V409 L1290 435 L1314 409 V453" />
            </g>
          </g>

          {/* Zombit tulevat vasemmalta pelaajan perässä ja pysähtyvät sisäänkäynnille */}
          {CHASERS.map((z, i) => (
            <g key={z.variant} className={`zr-cut-chaser zr-cut-chaser--${i + 1}`}>
              <Zombie x={0} scale={z.scale} delay={z.delay} variant={z.variant} />
            </g>
          ))}

          {/* Pelaaja: juoksee sisäänkäynnille ja laskeutuu portaita pimeään */}
          <g className="zr-cut-player">
            <g className="zr-cut-player-body">
              <g transform={`translate(${-s.frameWidth * s.originX * SCALE} ${885 - s.frameHeight * s.originY * SCALE}) scale(${SCALE})`}>
                <svg width={s.frameWidth} height={s.frameHeight} viewBox={`0 0 ${s.frameWidth} ${s.frameHeight}`} className="zr-cut-frame">
                  <image
                    className="zr-cut-run"
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
        </svg>
      </div>

      {/* Pimeä tunneli: junan valot lähestyvät */}
      <div className="zr-cut-dark" aria-hidden="true">
        <span className="zr-cut-headlight zr-cut-headlight--l" />
        <span className="zr-cut-headlight zr-cut-headlight--r" />
      </div>

      <div className="zr-cut-flash" aria-hidden="true" />

      <div className="zr-cut-card">
        <p className="zr-cut-world">
          Maailma {number} · {worldName}
        </p>
      </div>

      {/* Sama Ohita-nappi kuin alkuanimaatiossa (tyyli Intro.css:ssä) */}
      <button ref={skipRef} type="button" className="zr-intro-skip" onClick={onDone}>
        Ohita ›
      </button>
    </div>
  );
}