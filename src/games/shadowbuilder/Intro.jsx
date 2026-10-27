import { useEffect, useRef } from 'react';
import City from './City.jsx';
import Guardian from './Guardian.jsx';
import Logo from './Logo.jsx';
import './Intro.css';

// Alkuanimaation kesto millisekunteina. Ajoitukset ovat Intro.css:ssä (animation-delay);
// tämä luku vastaa viimeisen vaiheen loppua.
const DURATION = 13800;

// Tarina lyhyesti: vanha kaupunki näkyy muistona ja vajoaa varjoihin, tyhjälle aukealle nousee
// vartija, ja sen valo piirtää maahan ruudukon, johon kaupunki rakennetaan uudelleen.
// Rivit ovat tavallista tekstiä, joten ruudunlukija lukee ne.
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
    <div className="sb-intro">
      <City className="sb-intro-city" />
      {/* Pimeys laskeutuu, kun kaupunki katoaa, ja väistyy, kun vartijan valo leimahtaa */}
      <div className="sb-intro-dark" aria-hidden="true" />

      <div className="sb-intro-guardian">
        <Guardian />
      </div>
      {/* Paksu sumu aukealla; vartija hajottaa sen valopallollaan */}
      <div className="sb-intro-fog" aria-hidden="true" />

      <div className="sb-intro-story">
        <p className="sb-intro-line sb-intro-line--1">Täällä seisoi ennen kaupunki.</p>
        <p className="sb-intro-line sb-intro-line--2">Yhtenä yönä se katosi varjoihin.</p>
        <p className="sb-intro-line sb-intro-line--3">Vain varjot muistavat, missä talot seisoivat.</p>
        <p className="sb-intro-line sb-intro-line--4">Rakenna se uudelleen.</p>
      </div>

      <div className="sb-intro-title">
        <Logo className="sb-intro-logo" />
        <p className="sb-intro-chapter">
          <span>Luku 1</span>
          <span className="sb-intro-chapter-sep" aria-hidden="true" />
          <span>Kylä</span>
        </p>
      </div>

      <div className="sb-intro-progress" aria-hidden="true" />

      <button ref={skipRef} type="button" className="sb-btn sb-intro-skip" onClick={onDone}>
        Ohita
      </button>
    </div>
  );
}