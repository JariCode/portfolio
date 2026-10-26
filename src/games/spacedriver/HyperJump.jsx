import { useEffect, useRef, useState } from 'react';
import Starfield from './Starfield.jsx';
import Ship from './Ship.jsx';
import { Frame, Status } from './Hud.jsx';
import { play } from './sound.js';
import './HyperJump.css';

// Hyperhyppy sektorista seuraavaan: tähdet viiruina, alus täysillä moottoreilla, ja
// seuraavan sektorin nimi lukittuu näytölle. Ajoitukset ovat HyperJump.css:ssä.
const DURATION = 5000;
// Hetki, jolloin tähdet venyvät viiruiksi ja hypyn ääni alkaa (kuten alkuanimaatiossa):
// juuri ennen kuin alus kiitää ylös (HyperJump.css, 4,1 s)
const WARP_AT = 3600;

// from: läpäisty sektori (järjestysnumero), to: { index, name } seuraava sektori
export default function HyperJump({ from, to, onDone }) {
  const skipRef = useRef(null);
  const [warp, setWarp] = useState(false);

  useEffect(() => {
    // "Vähennä liikettä" -asetuksella välianimaatio ohitetaan
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stopJump;
    let finished = false;
    const done = setTimeout(
      () => {
        finished = true;
        onDone();
      },
      reduce ? 0 : DURATION,
    );
    // Hyppy: musiikki soi alusta asti, ja hypyn ääni alkaa vasta, kun alus lähtee
    const warpTimer = setTimeout(() => {
      setWarp(true);
      stopJump = play('hyperjump', { volume: 0.45 });
    }, WARP_AT);
    // Ohita-nappi saa fokuksen, joten Enter ja välilyönti ohittavat animaation
    skipRef.current?.focus({ preventScroll: true });
    return () => {
      clearTimeout(done);
      clearTimeout(warpTimer);
      // Loppuun asti katsottuna hypyn ääni saa soida loppuun uuden sektorin alussa.
      // Ohitettaessa se häivytetään, ettei se jää soimaan sektorin päälle.
      if (!finished) stopJump?.(0.6);
    };
  }, [onDone]);

  const done = `Sektori ${from + 1} selvitetty`;

  return (
    <div className={`sd-jump${warp ? ' sd-jump--warp' : ''}`} role="dialog" aria-label={`Hyperhyppy: sektori ${to.index + 1}, ${to.name}`}>
      <Starfield warp={warp} />
      <Frame className="sd-jump-frame" />
      <Status left="SD-2026 // Hyperhyppy" right={`Sektori ${to.index + 1}`} className="sd-jump-status" />

      <div className="sd-jump-notice">
        <span className="sd-jump-tag">Hyperhyppy</span>
        <span className="sd-jump-done" style={{ '--sd-chars': done.length }}>
          {done}
        </span>
      </div>

      <div className="sd-jump-hero" aria-hidden="true">
        <Ship power className="sd-jump-ship" />
      </div>

      {/* Valoviiva avautuu ja paljastaa seuraavan sektorin */}
      <div className="sd-jump-beam" aria-hidden="true" />
      <div className="sd-jump-target">
        <p className="sd-jump-number">Sektori {to.index + 1}</p>
        <p className="sd-jump-name" style={{ '--sd-chars': to.name.length }}>
          {to.name}
        </p>
        <p className="sd-jump-info">Koordinaatit lukittu</p>
      </div>

      <div className="sd-jump-progress" aria-hidden="true" />

      <button ref={skipRef} type="button" className="sd-btn sd-btn--ghost sd-jump-skip" onClick={onDone}>
        Ohita
      </button>
    </div>
  );
}