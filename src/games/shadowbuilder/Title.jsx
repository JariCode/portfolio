import { useEffect, useRef, useState } from 'react';
import City from './City.jsx';
import Guardian from './Guardian.jsx';
import Logo from './Logo.jsx';
import { buildingCount, clearSaves, readCity, readRecord } from './score.js';
import './Title.css';

// Ohjaimet näytetään Ohjeet-paneelissa; sama lista kuin pelin näppäinkäsittelyssä
const CONTROLS = [
  { keys: ['1–7'], label: 'Valitse rakennus tai tie' },
  { keys: ['Hiiri'], label: 'Rakenna ruutuun' },
  { keys: ['R'], label: 'Käännä rakennusta' },
  { keys: ['Delete'], label: 'Pura' },
  { keys: ['Välilyönti'], label: 'Tauko' },
  { keys: ['M'], label: 'Äänet päälle/pois' },
  { keys: ['Esc'], label: 'Sulje peli' },
];

// onResume(kaupunki): keskeneräinen kaupunki jatkuu tallennetusta kohdasta (score.js)
export default function Title({ onStart, onResume }) {
  // Ennätys luetaan vain näytettäväksi; tallennus tapahtuu, kun kaupunki valmistuu (score.js)
  const [record, setRecord] = useState(readRecord);
  const [city, setCity] = useState(readCity);
  // Tyhjennyksen vahvistus: null = ei avattu, 'open' = kysytään, 'closed' = peruttu (fokus
  // palaa tyhjennyslinkkiin). Kaksi painallusta, ettei kaupunki katoa vahingossa.
  const [confirm, setConfirm] = useState(null);
  const [help, setHelp] = useState(false);
  const startRef = useRef(null);

  // Pääpainike (Jatka tai Aloita peli) saa fokuksen, joten Enter ja välilyönti käynnistävät heti.
  // Myös tyhjennyksen jälkeen, kun Jatka-nappi poistui ja Aloita peli tuli tilalle.
  useEffect(() => {
    startRef.current?.focus({ preventScroll: true });
  }, [city]);

  // Poistaa tämän pelin kaupungin ja ennätyksen (score.js) ja päivittää näkymän heti
  const clear = () => {
    clearSaves();
    setRecord(null);
    setCity(null);
    setConfirm(null);
  };

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
          {/* Keskeneräinen kaupunki: Jatka on pääpainike ja Uusi peli aloittaa tyhjästä */}
          {city && (
            <button ref={startRef} type="button" className="sb-btn sb-btn--start" onClick={() => onResume(city)}>
              Jatka
            </button>
          )}
          <button
            ref={city ? null : startRef}
            type="button"
            className={city ? 'sb-btn' : 'sb-btn sb-btn--start'}
            onClick={onStart}
          >
            {city ? 'Uusi peli' : 'Aloita peli'}
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
          {city && (
            <>
              <br />
              Kaupungissasi <strong>{buildingCount(city)} rakennusta</strong>
            </>
          )}
        </p>
        {/* Tallennusten tyhjennys; näkyy vain, kun tallennettavaa on */}
        {(record || city) && (
          <p className="sb-title-clear" role="group" aria-label="Tallennusten tyhjennys">
            {confirm === 'open' ? (
              <>
                <span>Poistetaanko kaupunki ja ennätys?</span>
                <button type="button" onClick={clear}>
                  Kyllä
                </button>
                {/* Fokus Peru-napille: Enter ei poista mitään vahingossa */}
                <button type="button" autoFocus onClick={() => setConfirm('closed')}>
                  Peru
                </button>
              </>
            ) : (
              <button type="button" autoFocus={confirm === 'closed'} onClick={() => setConfirm('open')}>
                Tyhjennä tallennukset
              </button>
            )}
          </p>
        )}
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