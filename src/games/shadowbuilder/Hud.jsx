import MuteButton from './MuteButton.jsx';
import { CHAPTERS } from './buildings.js';
import './Hud.css';

// Yläreunan tiedot: luku ja eteneminen kohti seuraavaa lukua, raha, asukkaat, sähkö ja päivä.
// Oikealla nopeus, tauko, mykistys ja valikko. Päivän vaihtuessa näkyy hetken päivän tulos.

const ICONS = {
  money: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm.9 4v1.3c1.3.2 2.3 1 2.5 2.2h-1.8c-.2-.6-.8-.9-1.6-.9-.9 0-1.5.4-1.5 1 0 .5.4.8 1.7 1.1 2 .4 3.4 1 3.4 2.8 0 1.3-1 2.3-2.7 2.6V18h-1.8v-1.3c-1.5-.2-2.6-1.1-2.8-2.5h1.8c.2.7.9 1.1 1.9 1.1s1.7-.4 1.7-1.1c0-.6-.5-.9-1.8-1.2-1.9-.4-3.3-1-3.3-2.7 0-1.3 1-2.2 2.5-2.5V7h1.8z',
  pop: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6H2zm15.5 0c0-1.9-.7-3.6-1.9-4.9 3.1.2 5.4 2.2 5.4 4.9h-3.5z',
  power: 'M13 2 4 14h6l-1 8 9-12h-6l1-8z',
  sun: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM11 1h2v3h-2zM11 20h2v3h-2zM1 11h3v2H1zM20 11h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zM16.3 17.7l1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z',
  moon: 'M20 15.5A8.5 8.5 0 0 1 8.5 4a8.5 8.5 0 1 0 11.5 11.5z',
};

function Icon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

export default function Hud({ chapter, pop, money, energy, day, t, report, paused, speed, onPause, onSpeed, onExit }) {
  const current = CHAPTERS[chapter - 1];
  const progress = Math.min(1, Math.max(0, (pop - current.from) / (current.to - current.from)));
  const dark = energy.use > energy.prod;
  const income = report ? `${report.income >= 0 ? '+' : '−'}${Math.abs(report.income)} €` : '';

  return (
    <div className="sb-hud">
      <div className="sb-hud-top">
        <div className="sb-hud-chapter">
          <p className="sb-hud-title">
            <span>Luku {current.n}</span>
            <span className="sb-hud-sep" aria-hidden="true" />
            <span>{current.name}</span>
          </p>
          {/* Eteneminen luvun sisällä: kylä 0–100, kaupunki 100–500, suurkaupunki 500–1000 */}
          <div className="sb-hud-progress" style={{ '--p': progress }} aria-label={`${pop} / ${current.to} asukasta`}>
            <span />
          </div>
          <p className="sb-hud-goal">
            {pop} / {current.to} asukasta
          </p>
        </div>

        <div className="sb-hud-actions">
          <button
            type="button"
            className="sb-icon-btn sb-hud-speed"
            aria-label={`Nopeus ${speed}× (F)`}
            title="Nopeus (F)"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSpeed}
          >
            {speed}×
          </button>
          <button
            type="button"
            className={`sb-icon-btn${paused ? ' is-active' : ''}`}
            aria-pressed={paused}
            aria-label="Tauko (välilyönti)"
            title="Tauko (välilyönti)"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onPause}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {paused ? <path d="M8 5l11 7-11 7z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
            </svg>
          </button>
          <MuteButton />
          <button type="button" className="sb-btn sb-hud-exit" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={onExit}>
            Valikko
          </button>
        </div>
      </div>

      <div className="sb-hud-stats">
        <span className={`sb-stat${money < 20 ? ' is-bad' : ''}`} title="Raha">
          <Icon name="money" />
          {money} €
        </span>
        <span className="sb-stat" title="Asukkaat">
          <Icon name="pop" />
          {pop}
        </span>
        <span className={`sb-stat${dark ? ' is-bad' : ''}`} title="Sähkö: tuotanto / kulutus">
          <Icon name="power" />
          {energy.prod}/{energy.use}
        </span>
        <span className="sb-stat sb-stat--day" title="Päivä" style={{ '--t': t }}>
          <Icon name={t < 0.5 ? 'sun' : 'moon'} />
          Päivä {day}
        </span>
      </div>

      {/* Päivän tulos: key vaihtuu joka päivä, joten animaatio alkaa alusta */}
      {report && (
        <p key={report.day} className={`sb-hud-report${report.blackout ? ' is-bad' : ''}`} role="status">
          Päivä {report.day}: {income}
          {report.blackout && ' · sähköpula'}
        </p>
      )}
    </div>
  );
}