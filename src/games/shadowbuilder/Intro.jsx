import { useEffect, useRef } from 'react';
import City from './City.jsx';
import Guardian from './Guardian.jsx';
import Logo from './Logo.jsx';
import './Intro.css';

// Alkuanimaation kesto millisekunteina. Ajoitukset ovat Intro.css:ssä (animation-delay);
// tämä luku vastaa viimeisen vaiheen loppua.
const DURATION = 12400;

// Tarina lyhyesti: valot sammuvat, kyltin varjosta nousee vartija, valot palaavat ja logo
// syttyy. Rivit ovat tavallista tekstiä, joten ruudunlukija lukee ne.
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
      {/* Pimeys laskeutuu, kun valot sammuvat, ja väistyy, kun ne palaavat */}
      <div className="sb-intro-dark" aria-hidden="true" />

      <div className="sb-intro-guardian">
        <Guardian />
      </div>
      {/* Paksu sumu kadulla; vartija hajottaa sen valopallollaan */}
      <div className="sb-intro-fog" aria-hidden="true" />

      <div className="sb-intro-story">
        <p className="sb-intro-line sb-intro-line--1">Yhtenä yönä kaupungin valot sammuivat.</p>
        <p className="sb-intro-line sb-intro-line--2">Vain varjot muistavat, missä talot seisoivat.</p>
        <p className="sb-intro-line sb-intro-line--3">Herätä kaupunki.</p>
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