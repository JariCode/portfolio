import Building from './Building.jsx';
import { rotatable, TOOLS, toolById, unlocked } from './buildings.js';
import './Toolbar.css';

// Rakennusvalikko alareunassa. Kuvakkeet ovat samoja piirroksia kuin ruudukossa, pienennettyinä.
// Valitun työkalun nimi ja lyhyt kuvaus näkyvät valikon yläpuolella, joten puhelimessakin
// tietää, mitä on rakentamassa. Kääntönappi näkyy, kun valittuna on käännettävä rakennus;
// se korostuu, kun pelaaja on kääntänyt itse (manual), muuten rakennus kääntyy kohti tietä.
// hint: kodin asukkaat kursorin kohdalla ({ title, text }) tai syy, miksi ruutuun ei voi
// rakentaa ({ error }). Rakennus, johon rahat eivät riitä, näkyy himmeänä.

function Icon({ id }) {
  if (id === 'demolish') {
    return (
      <svg viewBox="-24 -24 48 48" aria-hidden="true" className="sb-tool-icon">
        <path className="sb-tool-x" d="M-10 -10 L10 10 M10 -10 L-10 10" />
      </svg>
    );
  }
  // Rakennus ruudussa (0, 0): näkymä rajataan ruudun ja katon ympärille (kerrostalo on korkea)
  return (
    <svg viewBox={id === 'tower' ? '-62 -80 124 124' : '-44 -28 88 88'} aria-hidden="true" className="sb-tool-icon">
      <Building type={id} x={0} y={0} connected lit links={id === 'road' ? [[1, 0], [-1, 0]] : []} ghost />
    </svg>
  );
}

export default function Toolbar({ tool, chapter, money, hint, onSelect, onRotate, manual }) {
  const current = toolById(tool);
  return (
    <div className="sb-toolbar">
      <div className="sb-toolbar-head">
        <p className={`sb-toolbar-info${hint?.error ? ' is-error' : ''}`} aria-live="polite">
          {hint?.title ? (
            <>
              <strong>{hint.title}</strong> {hint.text}
            </>
          ) : (
            <>
              <strong>
                {current.name}
                {current.price > 0 && ` ${current.price} €`}
              </strong>{' '}
              {hint?.error ?? current.info}
            </>
          )}
        </p>
        {rotatable(tool) && (
          <button
            type="button"
            className={`sb-tool-rotate${manual ? ' is-active' : ''}`}
            title="Käännä rakennusta (R)"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onRotate}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12a7 7 0 1 1-2.05-4.95" />
              <path d="M17.5 3.5v4h-4" />
            </svg>
            <span>Käännä</span>
            <kbd aria-hidden="true">R</kbd>
          </button>
        )}
      </div>
      <div className="sb-toolbar-row" role="toolbar" aria-label="Rakennukset">
        {TOOLS.map((t) => {
          const locked = !unlocked(t.id, chapter);
          const cls = ['sb-tool', t.id === tool && 'is-active', locked && 'is-locked', !locked && money < t.price && 'is-poor'];
          return (
            <button
              key={t.id}
              type="button"
              className={cls.filter(Boolean).join(' ')}
              aria-pressed={t.id === tool}
              disabled={locked}
              title={locked ? `${t.name} – avautuu: Luku ${t.chapter}` : `${t.name} ${t.price ? `${t.price} € ` : ''}(${t.key})`}
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(t.id)}
            >
              <Icon id={t.id} />
              <span className="sb-tool-name">{t.name}</span>
              <span className="sb-tool-key" aria-hidden="true">
                {t.key === 'Delete' ? 'Del' : t.key}
              </span>
              {/* Lukittu: pieni lukko ja luku, jossa rakennus avautuu */}
              {locked && (
                <span className="sb-tool-lock" aria-hidden="true">
                  <svg viewBox="0 0 16 16">
                    <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" />
                    <rect x="3" y="7" width="10" height="7" rx="1" />
                  </svg>
                  Luku {t.chapter}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}