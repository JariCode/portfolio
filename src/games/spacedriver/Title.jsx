import { useEffect, useRef, useState } from 'react';
import Starfield from './Starfield.jsx';
import Ship from './Ship.jsx';
import { Frame, Status } from './Hud.jsx';
import { readRecord } from './score.js';
import './Title.css';

// Ohjaimet näytetään Ohjeet-paneelissa; sama lista kuin pelin näppäinkäsittelyssä
const CONTROLS = [
  { keys: ['←', '↑', '↓', '→'], alt: 'WASD', label: 'Liiku' },
  { keys: ['Välilyönti'], alt: '', label: 'Pommi' },
  { keys: ['M'], alt: '', label: 'Äänet päälle/pois' },
  { keys: ['Esc'], alt: '', label: 'Sulje peli' },
];

// Taustalla lipuvat viholliset: yksi kustakin laivastosta (sijainti prosentteina)
const DRIFTERS = [
  { faction: 'laivasto1', type: 'fighter', x: 14, delay: 0 },
  { faction: 'laivasto2', type: 'scout', x: 80, delay: 4 },
  { faction: 'laivasto3', type: 'bomber', x: 42, delay: 8 },
];

// Ennätys mittarinäytön tapaan aina kuusinumeroisena
const digits = (score) => String(score).padStart(6, '0');

export default function Title({ onStart }) {
  // Ennätys luetaan vain näytettäväksi; tallennus tapahtuu loppuruudussa (score.js)
  const [record] = useState(readRecord);
  const [help, setHelp] = useState(false);
  const startRef = useRef(null);

  // Aloita-nappi saa fokuksen, joten Enter ja välilyönti käynnistävät pelin heti
  useEffect(() => {
    startRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={help ? 'sd-title sd-title--help' : 'sd-title'}>
      <Starfield />

      <div className="sd-title-drifters" aria-hidden="true">
        {DRIFTERS.map((d) => (
          <span key={d.faction} className="sd-title-drifter" style={{ left: `${d.x}%`, '--sd-delay': `${d.delay}s` }}>
            <Ship faction={d.faction} type={d.type} />
          </span>
        ))}
      </div>

      <div className="sd-title-hero" aria-hidden="true">
        <span className="sd-title-reticle" />
        <Ship className="sd-title-ship" />
      </div>

      <Frame />
      <Status left="SD-2026" right="Järjestelmät OK" />

      <div className="sd-title-content">
        <h3 className="sd-logo" aria-label="Space Driver 2026">
          <span className="sd-logo-line sd-logo-space" aria-hidden="true">SPACE</span>
          <span className="sd-logo-line sd-logo-driver" aria-hidden="true">DRIVER</span>
          <span className="sd-logo-year" aria-hidden="true">
            <span>//</span> 2026 <span>//</span>
          </span>
        </h3>

        {/* Sanat syttyvät yksi kerrallaan, välissä meripihkaiset merkkivalot (Title.css) */}
        <p className="sd-tagline">
          <span className="sd-tag-word">Lennä</span>
          <span className="sd-tag-sep" aria-hidden="true" />
          <span className="sd-tag-word">Ammu</span>
          <span className="sd-tag-sep" aria-hidden="true" />
          <span className="sd-tag-word">Selviydy</span>
        </p>

        <div className="sd-actions">
          <button ref={startRef} type="button" className="sd-btn sd-btn--start" onClick={onStart}>
            Aloita peli
          </button>
          <button
            type="button"
            className="sd-btn sd-btn--ghost"
            aria-expanded={help}
            aria-controls="sd-help"
            onClick={() => setHelp((h) => !h)}
          >
            Ohjeet
          </button>
        </div>

        <p className="sd-record">
          <span className="sd-record-label">Ennätys</span>
          <span className="sd-record-value">{record ? digits(record.score) : '------'}</span>
        </p>
      </div>

      {help && (
        <div id="sd-help" className="sd-help" role="region" aria-label="Ohjeet">
          <p className="sd-help-head">
            <span>Ohjaimet</span>
            <span aria-hidden="true">SD-2026</span>
          </p>
          <dl>
            {CONTROLS.map((c) => (
              <div key={c.label}>
                <dt>{c.label}</dt>
                <dd>
                  <span className="sd-help-keys">
                    {c.keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </span>
                  {c.alt && <span className="sd-help-alt">tai {c.alt}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p className="sd-help-text">
            Alus ampuu itse. Puhelimella vedä alusta sormella. Väistä esteitä ja ammuksia, kerää tehostimia ja selviä kolmen sektorin läpi.
          </p>
          <button type="button" className="sd-btn sd-btn--ghost sd-help-close" onClick={() => setHelp(false)}>
            Selvä
          </button>
        </div>
      )}
    </div>
  );
}