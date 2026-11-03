import { useEffect, useRef } from 'react';
import Guardian from './Guardian.jsx';
import './Ending.css';

// Loppuanimaation kesto millisekunteina. Ajoitukset ovat Ending.css:ssä (animation-delay);
// tämä luku vastaa viimeisen vaiheen loppua.
const DURATION = 12000;

// Valohiukkaset, joiksi vartija hajoaa: vaakapaikka (% vartijan leveydestä), viive (s) ja
// nousun pituus (cqw). Kiinteä lista, jotta animaatio on joka kerta sama.
const MOTES = [
  [22, 0, 30], [48, 0.2, 38], [70, 0.1, 26], [35, 0.5, 44], [58, 0.4, 34], [80, 0.7, 28],
  [15, 0.8, 36], [42, 1, 46], [64, 0.9, 40], [28, 1.2, 32], [52, 1.3, 50], [74, 1.4, 30],
  [38, 1.6, 42], [60, 1.7, 36], [46, 1.9, 48], [20, 2, 28], [68, 2.1, 38], [54, 2.3, 44],
];

// Loppu, kun tavoite täyttyy. Pelaajan oma kaupunki jää näkyviin: taivas tummuu,
// kaikki ikkunat syttyvät (Game.css, .is-ending), revontulet leviävät taivaalle ja vartija
// nousee katsomaan kaupunkia. Lopuksi se hajoaa valoksi, ja peli siirtyy lopputeksteihin.
// Rivit ovat tavallista tekstiä, joten ruudunlukija lukee ne.
export default function Ending({ onDone }) {
  const skipRef = useRef(null);

  useEffect(() => {
    // "Vähennä liikettä" -asetuksella animaatio ohitetaan kokonaan
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(onDone, reduce ? 0 : DURATION);
    skipRef.current?.focus({ preventScroll: true });
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="sb-end" role="region" aria-label="Loppu">
      <div className="sb-end-veil" aria-hidden="true" />

      {/* Revontulet: kolme liukuvärinauhaa, jotka aaltoilevat eri tahdissa */}
      <div className="sb-end-aurora" aria-hidden="true">
        <span className="sb-end-ribbon sb-end-ribbon--1" />
        <span className="sb-end-ribbon sb-end-ribbon--2" />
        <span className="sb-end-ribbon sb-end-ribbon--3" />
      </div>

      <div className="sb-end-guardian" aria-hidden="true">
        <Guardian mood="iloinen" />
        <span className="sb-end-flare" />
        {MOTES.map(([x, delay, rise]) => (
          <span
            key={`${x}-${delay}`}
            className="sb-end-mote"
            style={{ '--x': `${x}%`, '--delay': `${delay}s`, '--rise': `${-rise}cqw` }}
          />
        ))}
      </div>

      <div className="sb-end-story">
        <p className="sb-end-line sb-end-line--1">Varjot väistyvät.</p>
        <p className="sb-end-line sb-end-line--2">Kaupungin valot loistavat taas.</p>
      </div>

      {/* Lopuksi valo täyttää ruudun ja häipyy lopputeksteihin */}
      <div className="sb-end-flash" aria-hidden="true" />

      <button ref={skipRef} type="button" className="sb-btn sb-end-skip" onClick={onDone}>
        Ohita
      </button>
    </div>
  );
}