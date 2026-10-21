import { useEffect, useRef } from 'react';
import CityScape from './CityScape.jsx';
import './Intro.css';

// Alkuanimaation kesto millisekunteina. Ajoitukset ovat Intro.css:ssä (animation-delay);
// tämä luku vastaa viimeisen vaiheen loppua.
const DURATION = 9400;

// Pimeydestä syttyvät silmäparit (sijainnit prosentteina pelinäkymästä)
const EYES = [
  { x: 12, y: 70, delay: 4.6 },
  { x: 27, y: 78, delay: 5.0 },
  { x: 71, y: 74, delay: 4.8 },
  { x: 86, y: 68, delay: 5.3 },
  { x: 55, y: 82, delay: 5.6 },
];

export default function Intro({ onDone }) {
  const skipRef = useRef(null);

  useEffect(() => {
    // "Vähennä liikettä" -asetuksella animaatio ohitetaan kokonaan
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(onDone, reduce ? 0 : DURATION);
    // Ohita-nappi saa fokuksen, joten Enter ja välilyönti ohittavat animaation
    skipRef.current?.focus({ preventScroll: true });
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="zr-intro">
      <div className="zr-intro-camera">
        <CityScape variant="intro" />
      </div>

      <div className="zr-intro-eyes" aria-hidden="true">
        {EYES.map((e) => (
          <span
            key={`${e.x}-${e.y}`}
            className="zr-intro-eye"
            style={{ left: `${e.x}%`, top: `${e.y}%`, '--zr-delay': `${e.delay}s` }}
          />
        ))}
      </div>

      {/* Tummennus tekstin taakse, jotta se erottuu kylteistä */}
      <div className="zr-intro-shade" aria-hidden="true" />
      <div className="zr-intro-blackout" aria-hidden="true" />

      {/* Tarinateksti: ruudunlukija lukee rivit tavallisena tekstinä */}
      <div className="zr-intro-story">
        <p className="zr-intro-line zr-intro-line--1">Kaupunki ei koskaan nuku.</p>
        <p className="zr-intro-line zr-intro-line--2" data-text="Eivätkä kuolleetkaan.">
          Eivätkä kuolleetkaan.
        </p>
      </div>

      <div className="zr-intro-flash" aria-hidden="true" />

      <div className="zr-intro-logo-wrap">
        <p className="zr-intro-logo" data-text="Z-RUNNER">
          Z-RUNNER
        </p>
        <p className="zr-intro-world">Maailma 1 · Neonkatu</p>
      </div>

      <div className="zr-intro-progress" aria-hidden="true" />

      <button ref={skipRef} type="button" className="zr-intro-skip" onClick={onDone}>
        Ohita
        <span aria-hidden="true"> ›</span>
      </button>
    </div>
  );
}