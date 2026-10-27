import Building from './Building.jsx';
import { TOOLS, toolById } from './buildings.js';
import './Toolbar.css';

// Rakennusvalikko alareunassa. Kuvakkeet ovat samoja piirroksia kuin ruudukossa, pienennettyinä.
// Valitun työkalun nimi ja lyhyt kuvaus näkyvät valikon yläpuolella, joten puhelimessakin
// tietää, mitä on rakentamassa.

function Icon({ id }) {
  if (id === 'demolish') {
    return (
      <svg viewBox="-24 -24 48 48" aria-hidden="true" className="sb-tool-icon">
        <path className="sb-tool-x" d="M-10 -10 L10 10 M10 -10 L-10 10" />
      </svg>
    );
  }
  // Rakennus ruudussa (0, 0): näkymä rajataan ruudun ja katon ympärille
  return (
    <svg viewBox="-44 -28 88 88" aria-hidden="true" className="sb-tool-icon">
      <Building type={id} x={0} y={0} connected lit links={id === 'road' ? [[1, 0], [-1, 0]] : []} ghost />
    </svg>
  );
}

export default function Toolbar({ tool, onSelect }) {
  const current = toolById(tool);
  return (
    <div className="sb-toolbar">
      <p className="sb-toolbar-info" aria-live="polite">
        {current ? (
          <>
            <strong>{current.name}</strong> {current.info}
          </>
        ) : (
          'Valitse rakennus'
        )}
      </p>
      <div className="sb-toolbar-row" role="toolbar" aria-label="Rakennukset">
        {TOOLS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`sb-tool${t.id === tool ? ' is-active' : ''}${t.locked ? ' is-locked' : ''}`}
            aria-pressed={t.id === tool}
            disabled={Boolean(t.locked)}
            title={t.locked ? `${t.name} – avautuu: ${t.locked}` : `${t.name} (${t.key})`}
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
            {t.locked && (
              <span className="sb-tool-lock" aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2" />
                  <rect x="3" y="7" width="10" height="7" rx="1" />
                </svg>
                {t.locked}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}