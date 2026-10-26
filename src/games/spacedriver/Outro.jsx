import { useEffect, useRef } from 'react';
import Starfield from './Starfield.jsx';
import { Frame } from './Hud.jsx';
import { CREDITS } from './credits.js';
import './Outro.css';

// Lopputekstit viimeisen pomon jälkeen: intron tähtitaivas ja musiikki, ja tekstit rullaavat
// kallistettuna kaukaisuuteen. Tekijät luetaan credits.js:stä, joten uusi kuva tai ääni
// päätyy lopputeksteihin ilman muutoksia tähän. Kun rullaus päättyy (tai pelaaja ohittaa),
// näytetään loppuruutu.
const ROLL_S = 52;

// credits.js:n tyypit lopputekstien järjestyksessä
const SECTIONS = [
  { type: 'alus', title: 'Pelaajan alus' },
  { type: 'vihollinen', title: 'Vihollislaivastot' },
  { type: 'tehostin', title: 'Tehostimet' },
  { type: 'tileset', title: 'Tilesetit' },
  { type: 'musiikki', title: 'Musiikki' },
  { type: 'ääni', title: 'Äänet' },
];

export default function Outro({ onDone }) {
  const skipRef = useRef(null);

  useEffect(() => {
    // "Vähennä liikettä": rullaus ohitetaan
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return;
    }
    skipRef.current?.focus({ preventScroll: true });
  }, [onDone]);

  // Vain rullauksen oma animaatio päättää lopputekstit (ei tähtien animaatiot)
  const rollEnded = (e) => {
    if (e.target === e.currentTarget) onDone();
  };

  return (
    <div className="sd-out" role="region" aria-label="Lopputekstit">
      <Starfield />
      <Frame className="sd-out-frame" />

      <div className="sd-out-stage">
        <div className="sd-out-roll" style={{ '--sd-roll': `${ROLL_S}s` }} onAnimationEnd={rollEnded}>
          <p className="sd-out-episode">Sektorit 1–3 selvitetty</p>
          <p className="sd-out-logo">
            <span className="sd-out-logo-space">SPACE</span>
            <span className="sd-out-logo-driver">DRIVER</span>
          </p>

          <div className="sd-out-story">
            <p>Vuosi 2026. Kolme vihollislaivastoa ylitti rajan, ja vain yksi alus lähti niitä vastaan.</p>
            <p>
              Asteroidikentän risteilijä, aseman raunion rynnäkköristeilijä ja avaruussumun lippulaiva
              ovat kaatuneet. Rajalla on taas hiljaista.
            </p>
            <p>Mutta hyperhypyn toisella puolella odottaa aina uusi sektori…</p>
          </div>

          <section className="sd-out-section">
            <h3>Peli</h3>
            <p>
              <strong>Jari Karri</strong>
              <span>JariCode</span>
            </p>
          </section>
          <section className="sd-out-section">
            <h3>Sektorien kartat</h3>
            <p>
              <strong>Jari Karri</strong>
              <span>Tiled</span>
            </p>
          </section>
          <section className="sd-out-section">
            <h3>Ohjaamon näyttö ja animaatiot</h3>
            <p>
              <strong>Claude (Anthropic)</strong>
              <span>Piirretty koodilla</span>
            </p>
          </section>

          {SECTIONS.map(({ type, title }) => {
            const items = CREDITS.filter((c) => c.type === type);
            if (!items.length) return null;
            return (
              <section key={type} className="sd-out-section">
                <h3>{title}</h3>
                {items.map((c) => (
                  <p key={c.name}>
                    <strong>{c.name}</strong>
                    <span>{c.author}</span>
                    <small>{c.license}</small>
                  </p>
                ))}
              </section>
            );
          })}

          <p className="sd-out-thanks">Kiitos pelaamisesta!</p>
        </div>
      </div>

      <button ref={skipRef} type="button" className="sd-btn sd-btn--ghost sd-out-skip" onClick={onDone}>
        Ohita
      </button>
    </div>
  );
}