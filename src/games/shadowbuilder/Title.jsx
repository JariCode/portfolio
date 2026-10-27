import { useEffect, useRef, useState } from 'react';
import City from './City.jsx';
import Guardian from './Guardian.jsx';
import Logo from './Logo.jsx';
import { readRecord } from './score.js';
import './Title.css';

// Ohjaimet näytetään Ohjeet-paneelissa; sama lista kuin pelin näppäinkäsittelyssä
const CONTROLS = [
  { keys: ['1–7'], label: 'Valitse rakennus tai tie' },
  { keys: ['Hiiri'], label: 'Rakenna ruutuun' },
  { keys: ['Delete'], label: 'Pura' },
  { keys: ['Välilyönti'], label: 'Tauko' },
  { keys: ['M'], label: 'Äänet päälle/pois' },
  { keys: ['Esc'], label: 'Sulje peli' },
];

export default function Title({ onStart }) {
  // Ennätys luetaan vain näytettäväksi; tallennus tapahtuu, kun kaupunki valmistuu (score.js)
  const [record] = useState(readRecord);
  const [help, setHelp] = useState(false);
  const startRef = useRef(null);

  // Aloita-nappi saa fokuksen, joten Enter ja välilyönti käynnistävät pelin heti
  useEffect(() => {
    startRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className={help ? 'sb-title sb-title--help' : 'sb-title'}>
      <City />
      <div className="sb-title-guardian">
        <Guardian />
      </div>

      <div className="sb-title-content">
        <Logo className="sb-title-logo" />

        <p className="sb-tagline">
          <span>Rakenna</span>
          <span className="sb-tagline-sep" aria-hidden="true" />
          <span>Valaise</span>
          <span className="sb-tagline-sep" aria-hidden="true" />
          <span>Herätä</span>
        </p>
        <p className="sb-title-sub">Kaupunki katosi varjoihin. Rakenna se uudelleen tyhjästä.</p>

        <div className="sb-actions">
          <button ref={startRef} type="button" className="sb-btn sb-btn--start" onClick={onStart}>
            Aloita peli
          </button>
          <button
            type="button"
            className="sb-btn"
            aria-expanded={help}
            aria-controls="sb-help"
            onClick={() => setHelp((h) => !h)}
          >
            Ohjeet
          </button>
        </div>

        <p className="sb-record">
          {record ? (
            <>
              Ennätys <strong>{record.days} päivää</strong> tuhanteen asukkaaseen
            </>
          ) : (
            'Ei vielä ennätystä'
          )}
        </p>
      </div>

      {help && (
        <div id="sb-help" className="sb-help" role="region" aria-label="Ohjeet">
          <h4>Ohjeet</h4>
          <dl>
            {CONTROLS.map((c) => (
              <div key={c.label}>
                <dt>{c.label}</dt>
                <dd>
                  {c.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
          <p>
            Rakenna taloja, kauppoja ja sähköä, ja kasvata kaupunki tuhanteen asukkaaseen. Rakennukset heittävät
            varjoja: valokenno tarvitsee valoa, sienitarha varjoa. Puhelimella valitse rakennus valikosta ja napauta
            ruutua kahdesti.
          </p>
          <button type="button" className="sb-btn sb-help-close" onClick={() => setHelp(false)}>
            Selvä
          </button>
        </div>
      )}
    </div>
  );
}