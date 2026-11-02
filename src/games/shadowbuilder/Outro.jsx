import { useEffect, useRef } from 'react';
import Guardian from './Guardian.jsx';
import { CREDITS } from './credits.js';
import './Outro.css';

// Lopputekstit varjoteatterina: lyhdyn valaisema kangas, jonka päällä tekstit rullaavat
// varjoina. Alareunassa liukuu kaupungin siluetti, ja sen ikkunoista paistaa valo läpi.
// Vartija seisoo siluettina kankaan reunassa. Tekijät luetaan credits.js:stä, joten uusi
// ääni tai kuva päätyy lopputeksteihin ilman muutoksia tähän. Kun tekstit ovat rullanneet
// loppuun (tai pelaaja ohittaa), näytetään loppuruutu.
const ROLL_S = 44;

// credits.js:n tyypit lopputekstien järjestyksessä
const SECTIONS = [
  { type: 'grafiikka', title: 'Grafiikka ja animaatiot' },
  { type: 'fontti', title: 'Fontti' },
  { type: 'musiikki', title: 'Musiikki' },
  { type: 'ääni', title: 'Äänet' },
];

// Siluetin talot: [x, leveys, korkeus, ikkunarivejä]. Sama rivi piirretään kahdesti
// peräkkäin, jotta liukuminen jatkuu saumatta (Outro.css siirtää puolikkaan leveyden).
const SKYLINE = [
  [0, 60, 70, 2], [64, 44, 120, 4], [112, 80, 56, 1], [196, 40, 150, 5], [240, 70, 92, 3],
  [314, 36, 64, 2], [354, 90, 132, 4], [448, 50, 80, 2], [502, 64, 170, 6], [570, 84, 60, 1],
  [658, 46, 110, 3], [708, 72, 84, 2], [784, 40, 140, 5],
];
const SKYLINE_W = 824;

function Skyline() {
  return (
    <svg className="sb-out-skyline" viewBox={`0 0 ${SKYLINE_W * 2} 180`} preserveAspectRatio="none" aria-hidden="true">
      {[0, SKYLINE_W].map((shift) => (
        <g key={shift} transform={`translate(${shift} 0)`}>
          {SKYLINE.map(([x, w, h, rows]) => (
            <g key={x}>
              <rect className="sb-out-house" x={x} y={180 - h} width={w} height={h} />
              {/* Ikkunat ovat aukkoja siluetissa: lyhdyn valo paistaa niistä läpi */}
              {Array.from({ length: rows }, (_, r) =>
                Array.from({ length: Math.max(1, Math.floor(w / 18)) }, (__, c) => (
                  <rect
                    key={`${r}-${c}`}
                    className="sb-out-window"
                    x={x + 7 + c * 18}
                    y={180 - h + 12 + r * 24}
                    width="7"
                    height="10"
                  />
                )),
              )}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

// days: monennenko päivän aikana tavoite täyttyi, pop: asukkaat sillä hetkellä
export default function Outro({ days, pop, onDone }) {
  const skipRef = useRef(null);

  useEffect(() => {
    // "Vähennä liikettä": rullaus ohitetaan
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return;
    }
    skipRef.current?.focus({ preventScroll: true });
  }, [onDone]);

  // Vain rullauksen oma animaatio päättää lopputekstit (ei lyhdyn tai siluetin animaatiot)
  const rollEnded = (e) => {
    if (e.target === e.currentTarget) onDone();
  };

  return (
    <div className="sb-out" role="region" aria-label="Lopputekstit">
      <div className="sb-out-screen" aria-hidden="true" />
      <div className="sb-out-lamp" aria-hidden="true" />

      <div className="sb-out-stage">
        <div className="sb-out-roll" style={{ '--sb-roll': `${ROLL_S}s` }} onAnimationEnd={rollEnded}>
          <p className="sb-out-logo">
            <span>Shadow</span>
            <span>Builder</span>
          </p>
          <p className="sb-out-lead">
            Kaupunki heräsi
            <span>
              {pop} asukasta · {days} päivää
            </span>
          </p>

          <section className="sb-out-section">
            <h3>Peli</h3>
            <p>
              <strong>Jari Karri</strong>
              <span>JariCode</span>
            </p>
          </section>
          <section className="sb-out-section">
            <h3>Idea, tarina ja suunnittelu</h3>
            <p>
              <strong>Jari Karri</strong>
            </p>
          </section>

          {SECTIONS.map(({ type, title }) => {
            const items = CREDITS.filter((c) => c.type === type);
            if (!items.length) return null;
            return (
              <section key={type} className="sb-out-section">
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

          <p className="sb-out-thanks">Kiitos, rakentaja.</p>
        </div>
      </div>

      <div className="sb-out-guardian" aria-hidden="true">
        <Guardian />
      </div>
      <Skyline />

      <button ref={skipRef} type="button" className="sb-btn sb-out-skip" onClick={onDone}>
        Ohita
      </button>
    </div>
  );
}