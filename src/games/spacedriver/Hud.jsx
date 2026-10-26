import './Hud.css';

// Ohjaamon näytön osat, jotka toistuvat näkymästä toiseen (aloitus, alkuanimaatio, välisivut)

// Neljä kulmakiinnikettä näkymän reunoilla
export function Frame({ className = '' }) {
  return (
    <div className={`sd-frame ${className}`} aria-hidden="true">
      <span className="sd-frame-corner" />
      <span className="sd-frame-corner" />
      <span className="sd-frame-corner" />
      <span className="sd-frame-corner" />
    </div>
  );
}

// Tilarivi ylhäällä: vasemmalla tunnus, oikealla tila vilkkuvan merkkivalon kanssa
export function Status({ left, right, className = '' }) {
  return (
    <div className={`sd-status ${className}`} aria-hidden="true">
      <span>{left}</span>
      <span className="sd-status-led">{right}</span>
    </div>
  );
}