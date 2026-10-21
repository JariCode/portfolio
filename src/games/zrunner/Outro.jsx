import { useEffect, useRef } from 'react';
import { CREDITS } from './credits.js';
import { play } from './sound.js';
import './Outro.css';

// Lopputekstit: kuvakulma auton sisältä. Tuulilasin takana yö ja tie kiitävät vastaan,
// katulamput vilahtavat ohi ja tekstit rullaavat tuulilasin päällä. Tekijät luetaan
// credits.js:stä, joten uusi ääni tai kuva päätyy lopputeksteihin ilman muutoksia tähän.
// Kun tekstit ovat rullanneet loppuun (tai pelaaja ohittaa), näytetään pisteet.
const ROLL_S = 34;

const SECTIONS = [
  { type: 'hahmo', title: 'Hahmot' },
  { type: 'musiikki', title: 'Musiikki' },
  { type: 'ääni', title: 'Äänet' },
  { type: 'tileset', title: 'Grafiikka' },
];

// Katulamput tien kummallakin puolella: viive porrastaa ne tasaisesti
const LAMPS = [
  { side: 'l', delay: 0 },
  { side: 'r', delay: 0.6 },
  { side: 'l', delay: 1.2 },
  { side: 'r', delay: 1.8 },
];

// Kaupungin siluetti horisontissa: [x, leveys, korkeus]
const CITY = [
  [0, 70, 90], [80, 50, 140], [140, 90, 70], [240, 60, 160], [310, 80, 110], [400, 50, 190],
  [460, 100, 120], [570, 60, 80], [640, 80, 170], [730, 110, 130], [850, 60, 200], [920, 90, 100],
  [1020, 70, 150], [1100, 100, 90], [1210, 60, 180], [1280, 90, 120], [1380, 70, 160], [1460, 140, 100],
];

export default function Outro({ onDone }) {
  const skipRef = useRef(null);

  useEffect(() => {
    // Vähennä liikettä: rullaus ohitetaan
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return undefined;
    }
    skipRef.current?.focus({ preventScroll: true });
    // Moottorin ääni koko ajon ajan; hiljenee, jos tekstit ohitetaan. gap: 0, koska StrictMode
    // ajaa efektin kehitystilassa kahdesti ja toinen soitto muuten estyisi.
    const stop = play('car', { volume: 1, duration: ROLL_S + 1, gap: 0 });
    return () => stop?.(0.6);
  }, [onDone]);

  // Vain rullauksen oma animaatio päättää lopputekstit, ei lamppujen tai tien animaatiot
  const rollEnded = (e) => {
    if (e.target === e.currentTarget) onDone();
  };

  return (
    <div className="zr-out" role="region" aria-label="Lopputekstit">
      {/* ── Ulkona: yötaivas, kaupunki ja tie ── */}
      <div className="zr-out-view" aria-hidden="true">
        <svg className="zr-out-city" viewBox="0 0 1600 200" preserveAspectRatio="none">
          {CITY.map(([x, w, h]) => (
            <rect key={x} x={x} y={200 - h} width={w} height={h} />
          ))}
        </svg>
        <div className="zr-out-ground">
          <div className="zr-out-road" />
        </div>
        {LAMPS.map((l) => (
          <span key={l.delay} className={`zr-out-lamp zr-out-lamp--${l.side}`} style={{ '--zr-delay': `${l.delay}s` }} />
        ))}
      </div>

      {/* ── Auton sisätila: tuulilasin kehys, peili, kojelauta ja ratti ── */}
      <svg className="zr-out-cabin" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path
          className="zr-out-frame"
          fillRule="evenodd"
          d="M-200 -200 H1800 V1100 H-200 Z M250 70 Q800 40 1350 70 L1520 650 Q800 680 80 650 Z"
        />
        <path className="zr-out-frame-glow" d="M250 70 Q800 40 1350 70" />
        <rect className="zr-out-stem" x="796" y="40" width="8" height="34" />
        <rect className="zr-out-mirror" x="700" y="70" width="200" height="48" rx="14" />
        <path className="zr-out-dash" d="M-200 900 V690 Q800 600 1800 690 V900 Z" />
        <path className="zr-out-dash-glow" d="M-200 690 Q800 600 1800 690" />
        <g className="zr-out-gauges">
          <circle cx="420" cy="770" r="64" />
          <circle cx="570" cy="780" r="44" />
          <path className="zr-out-needle" d="M420 770 L462 740" />
        </g>
        <rect className="zr-out-screen" x="730" y="720" width="160" height="96" rx="10" />
        <path className="zr-out-route" d="M748 800 L790 768 L830 780 L872 740" />
        <g className="zr-out-wheel">
          <circle cx="420" cy="900" r="230" />
          <path d="M420 900 L230 860 M420 900 L610 860" />
        </g>
      </svg>

      {/* ── Lopputekstit tuulilasissa ── */}
      <div className="zr-out-credits">
        <div className="zr-out-roll" style={{ '--zr-roll': `${ROLL_S}s` }} onAnimationEnd={rollEnded}>
          <p className="zr-out-logo">Z-RUNNER</p>
          <p className="zr-out-lead">Pääsit pakoon. Tällä kertaa.</p>

          <section className="zr-out-section">
            <h3>Peli</h3>
            <p>Jari Karri · JariCode</p>
          </section>
          <section className="zr-out-section">
            <h3>Tarina ja juoni</h3>
            <p>Jari Karri</p>
          </section>
          <section className="zr-out-section">
            <h3>Kartat</h3>
            <p>Jari Karri · Tiled</p>
          </section>
          <section className="zr-out-section">
            <h3>Tilesetit, taustat ja animaatiot</h3>
            <p>
              <strong>Claude (Anthropic)</strong>
              <span>Piirretty koodilla</span>
            </p>
          </section>

          {SECTIONS.map(({ type, title }) => {
            const items = CREDITS.filter((c) => c.type === type);
            if (!items.length) return null;
            return (
              <section key={type} className="zr-out-section">
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

          <p className="zr-out-thanks">Kiitos pelaamisesta!</p>
        </div>
      </div>

      <button ref={skipRef} type="button" className="zr-intro-skip" onClick={onDone}>
        Ohita ›
      </button>
    </div>
  );
}