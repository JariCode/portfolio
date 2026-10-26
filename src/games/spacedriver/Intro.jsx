import { useEffect, useRef, useState } from 'react';
import Starfield from './Starfield.jsx';
import Ship from './Ship.jsx';
import { Frame, Status } from './Hud.jsx';
import { play } from './sound.js';
import './Intro.css';

// Alkuanimaation kesto millisekunteina. Ajoitukset ovat Intro.css:ssä (animation-delay);
// tämä luku vastaa viimeisen vaiheen loppua.
const DURATION = 10000;
// Hetki, jolloin tähdet venyvät viiruiksi (hyperhyppy alkaa)
const WARP_AT = 7000;

// Vihollislaivasto ylhäällä: [laivasto, tyyppi, vaakasijainti %, viive s, koko]
const FLEET = [
  ['laivasto1', 'fighter', 14, 0, 'sm'],
  ['laivasto2', 'scout', 32, 0.25, 'sm'],
  ['laivasto3', 'dreadnought', 50, 0.1, 'lg'],
  ['laivasto2', 'fighter', 68, 0.3, 'sm'],
  ['laivasto1', 'scout', 86, 0.15, 'sm'],
];

// Ohjaamon ilmoitukset: tunniste ja teksti, joka kirjoittuu esiin merkki kerrallaan
// (merkkien määrä ohjaa askelia, Intro.css --sd-chars)
const BOOT = { tag: 'SD-2026', text: 'Järjestelmät päällä' };
const LAUNCH = { tag: 'Laukaisu', text: 'Lähtölupa myönnetty' };

function Notice({ tag, text, className }) {
  return (
    <div className={`sd-intro-term ${className}`}>
      <span className="sd-intro-term-tag">{tag}</span>
      <span className="sd-intro-term-text" style={{ '--sd-chars': text.length }}>
        {text}
      </span>
    </div>
  );
}

export default function Intro({ onDone }) {
  const skipRef = useRef(null);
  const [warp, setWarp] = useState(false);

  useEffect(() => {
    // "Vähennä liikettä" -asetuksella animaatio ohitetaan kokonaan
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const done = setTimeout(onDone, reduce ? 0 : DURATION);
    // Hyperhypyn ääni alkaa tähtien venymisen kanssa. Ohitettaessa (tai animaation
    // päättyessä) ääni häivytetään, ettei se jää soimaan pelin päälle.
    let stopJump;
    const warpTimer = setTimeout(() => {
      setWarp(true);
      stopJump = play('hyperjump', { volume: 0.8 });
    }, WARP_AT);
    // Ohita-nappi saa fokuksen, joten Enter ja välilyönti ohittavat animaation
    skipRef.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(done);
      clearTimeout(warpTimer);
      stopJump?.(0.5);
    };
  }, [onDone]);

  return (
    <div className="sd-intro">
      <Starfield warp={warp} />

      {/* Vihollislaivasto saapuu yläreunasta, ja tähtäin lukittuu jokaiseen alukseen */}
      <div className="sd-intro-fleet" aria-hidden="true">
        {FLEET.map(([faction, type, x, delay, size]) => (
          <span
            key={`${faction}-${type}-${x}`}
            className={`sd-intro-enemy sd-intro-enemy--${size}`}
            style={{ left: `${x}%`, '--sd-delay': `${delay}s` }}
          >
            <Ship faction={faction} type={type} />
            <span className="sd-intro-lock" />
          </span>
        ))}
      </div>

      {/* Pelaajan alus nousee alhaalta ja lähtee hyperhyppyyn */}
      <div className="sd-intro-hero" aria-hidden="true">
        <Ship power className="sd-intro-ship" />
      </div>

      <Frame className="sd-intro-frame" />
      <Status left="SD-2026 // Laukaisu" right="Valmiustila" className="sd-intro-status" />

      {/* Tarinateksti: ruudunlukija lukee rivit tavallisena tekstinä */}
      <div className="sd-intro-story">
        <Notice {...BOOT} className="sd-intro-term--boot" />
        <p className="sd-intro-year">Vuosi 2026</p>
        <p className="sd-intro-warning">
          <span>Varoitus</span> Kolme laivastoa ylittää rajan
        </p>
        <Notice {...LAUNCH} className="sd-intro-term--launch" />
      </div>

      {/* Hyperhypyn valoviiva avautuu ja paljastaa logon */}
      <div className="sd-intro-beam" aria-hidden="true" />

      <div className="sd-intro-logo-wrap">
        <p className="sd-intro-logo">
          <span className="sd-intro-logo-line sd-intro-logo-space">SPACE</span>
          <span className="sd-intro-logo-line sd-intro-logo-driver">DRIVER</span>
        </p>
        <p className="sd-intro-sector">
          <span className="sd-intro-sector-name">Sektori 1</span>
          <span className="sd-intro-sector-info">Koordinaatit lukittu</span>
        </p>
      </div>

      <div className="sd-intro-progress" aria-hidden="true" />

      <button ref={skipRef} type="button" className="sd-btn sd-btn--ghost sd-intro-skip" onClick={onDone}>
        Ohita
      </button>
    </div>
  );
}