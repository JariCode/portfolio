import { useEffect, useRef, useState } from 'react';
import CityScape from './CityScape.jsx';
import { readRecord } from './score.js';
import './Title.css';

// Ohjaimet näytetään Ohjeet-paneelissa; sama lista kuin pelin näppäinkäsittelyssä
const CONTROLS = [
  { keys: ['←', '→'], alt: 'A / D', label: 'Liiku' },
  { keys: ['Välilyönti'], alt: '↑ / W', label: 'Hyppää' },
  { keys: ['X'], alt: 'K', label: 'Lyö' },
  { keys: ['Esc'], alt: '', label: 'Sulje peli' },
];

export default function Title({ onStart }) {
  // Ennätys luetaan vain näytettäväksi; tallennus tapahtuu maalissa (score.js)
  const [record] = useState(readRecord);
  const [help, setHelp] = useState(false);
  const startRef = useRef(null);

  // Aloita-nappi saa fokuksen, joten Enter ja välilyönti käynnistävät pelin heti
  useEffect(() => {
    startRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="zr-title">
      <CityScape variant="title" />
      <div className="zr-title-shade" aria-hidden="true" />

      <div className="zr-title-content">
        <h3 className="zr-logo" aria-label="Z-Runner">
          <span className="zr-logo-z" aria-hidden="true">Z</span>
          <span className="zr-logo-dash" aria-hidden="true">-</span>
          <span className="zr-logo-run" aria-hidden="true">RUNNER</span>
        </h3>
        <div className="zr-logo-tube" aria-hidden="true" />

        <p className="zr-tagline">
          <span>Juokse.</span> <span>Hyppää.</span> <span>Selviydy.</span>
        </p>
        <p className="zr-sub">Kolme maailmaa · yksi yö · liikaa zombeja</p>

        <div className="zr-actions">
          <button ref={startRef} type="button" className="zr-btn zr-btn--start" onClick={onStart}>
            <span className="zr-btn-play" aria-hidden="true" />
            Aloita peli
          </button>
          <button
            type="button"
            className="zr-btn zr-btn--ghost"
            aria-expanded={help}
            aria-controls="zr-help"
            onClick={() => setHelp((h) => !h)}
          >
            Ohjeet
          </button>
        </div>

        <p className="zr-record">
          {record ? (
            <>
              Ennätys <strong>{record.score} p</strong> · {record.time} · valopalloja{' '}
              <strong>{record.items}</strong> · zombeja <strong>{record.kills}</strong>
            </>
          ) : (
            'Ei vielä ennätystä'
          )}
        </p>
      </div>

      {help && (
        <div id="zr-help" className="zr-help" role="region" aria-label="Ohjeet">
          <h4>Ohjaimet</h4>
          <dl>
            {CONTROLS.map((c) => (
              <div key={c.label}>
                <dt>{c.label}</dt>
                <dd>
                  {c.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                  {c.alt && <span className="zr-help-alt">tai {c.alt}</span>}
                </dd>
              </div>
            ))}
          </dl>
          <p>Puhelimella ruudulle tulevat napit. Hyppää zombien päälle tai lyö ne kumoon, kerää valopallot ja ehdi maaliin.</p>
          <button type="button" className="zr-btn zr-btn--ghost zr-help-close" onClick={() => setHelp(false)}>
            Selvä
          </button>
        </div>
      )}
    </div>
  );
}