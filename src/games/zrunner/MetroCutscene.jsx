import { useEffect, useRef } from 'react';
import CityScape from './CityScape.jsx';
import { PLAYER_SHEET } from './player.js';
import './MetroCutscene.css';

// Välianimaatio maailmasta 1 metroon: pelaaja juoksee kadulla metron sisäänkäynnille
// zombit perässään ja katoaa portaita alas. Pimeässä tunnelissa lähestyy junan valot,
// välähdys ja seuraavan maailman nimi. Sama kaupunkimaisema kuin alkuanimaatiossa.
// Ajoitukset ovat MetroCutscene.css:ssä; DURATION vastaa niiden loppua.
const DURATION = 8800;

// Juoksurivi pelaajan sprite-arkista (player.js: run = rivi 3, 12 ruutua)
const RUN_ROW = 3;
const RUN_FRAMES = 12;

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

        {/* Metron sisäänkäynti ja pelaaja samassa koordinaatistossa kuin kaupunkimaisema */}
        <svg className="zr-cut-scene" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          {/* Katos ja pilarit */}
          <g className="zr-cut-entrance">
            <rect className="zr-cut-pillar" x="1090" y="650" width="16" height="235" />
            <rect className="zr-cut-pillar" x="1374" y="650" width="16" height="235" />
            <rect className="zr-cut-roof" x="1070" y="628" width="340" height="24" rx="4" />
            <rect className="zr-cut-roof-glow" x="1070" y="648" width="340" height="5" />
            {/* Valokeila portaikon päällä */}
            <polygon className="zr-cut-cone" points="1110,653 1370,653 1400,885 1080,885" />
            {/* M-kyltti tolpan päässä */}
            <g className="zr-cut-sign">
              {/* Korkealla tolpan päässä, ettei peitä hotellin kylttiä */}
              <rect className="zr-cut-pillar" x="1286" y="470" width="8" height="160" />
              <circle className="zr-cut-sign-ring" cx="1290" cy="430" r="44" />
              <path className="zr-cut-sign-m" d="M1266 453 V409 L1290 435 L1314 409 V453" />
            </g>
            {/* Portaikon aukko kadussa */}
            <rect className="zr-cut-hole" x="1110" y="872" width="260" height="40" />
          </g>

          {/* Pelaaja: juoksee vasemmalta, sitten portaita alas aukkoon */}
          <g className="zr-cut-player">
            <g transform={`translate(${-s.frameWidth * s.originX * 0.8} ${885 - s.frameHeight * s.originY * 0.8}) scale(0.8)`}>
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

          {/* Kaide portaikon edessä peittää alas menevän pelaajan */}
          <g className="zr-cut-rail">
            <rect x="1100" y="838" width="280" height="62" className="zr-cut-rail-glass" />
            <rect x="1100" y="836" width="280" height="5" className="zr-cut-rail-top" />
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