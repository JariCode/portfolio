import { useEffect, useRef } from 'react';
import Building from './Building.jsx';
import { iso, TH, TW } from './iso.js';
import { autoRot, canPlace, connectedSet, roadLinks, SIZE } from './buildings.js';
import { shadowOf } from './shadows.js';
import './Board.css';

// Isometrinen ruudukko: maa, tiet, varjot, rakennukset ja esikatselu.
// Osoitin muutetaan ruudukon koordinaateiksi maan tasossa (SVG:n oma muunnos), joten
// sama käsittely toimii hiirellä ja kosketuksella mihin kokoon tahansa skaalattuna.

const toPoints = (poly) => poly.map(([x, y]) => iso(x, y).join(',')).join(' ');
const tilePoints = (x, y) => toPoints([[x, y], [x + 1, y], [x + 1, y + 1], [x, y + 1]]);
const EDGE = toPoints([[0, 0], [SIZE, 0], [SIZE, SIZE], [0, SIZE]]);

// Leijuvan maalaatan reunat: maa on laatta, jolla on paksuutta
const DEPTH = 16;
const [lx, ly] = iso(0, SIZE);
const [bx, by] = iso(SIZE, SIZE);
const [rx, ry] = iso(SIZE, 0);
const SIDE_LEFT = `${lx},${ly} ${bx},${by} ${bx},${by + DEPTH} ${lx},${ly + DEPTH}`;
const SIDE_RIGHT = `${bx},${by} ${rx},${ry} ${rx},${ry + DEPTH} ${bx},${by + DEPTH}`;

const VIEW = `${-SIZE * TW - 20} -70 ${SIZE * TW * 2 + 40} ${SIZE * TH * 2 + 70 + DEPTH + 20}`;

// rots: rakennusten käännöt (null = kääntyy tietä kohti). previewRot: esikatselun kääntö.
export default function Board({ grid, rots, previewRot, tool, hover, light, shadows, shaded, onPoint }) {
  const svgRef = useRef(null);
  const linked = connectedSet(grid);

  // Pitkä painallus ei avaa suurennuslasia eikä valintavalikkoa (iPhone). Reactin
  // onTouchStart on passiivinen, joten estäminen vaatii natiivin kuuntelijan. Ruudukolla
  // ei ole tavallisia nappeja, joten click-tapahtumien estyminen ei haittaa.
  useEffect(() => {
    const el = svgRef.current;
    const stop = (e) => e.preventDefault();
    el.addEventListener('touchstart', stop, { passive: false });
    return () => el.removeEventListener('touchstart', stop);
  }, []);

  const tileAt = (e) => {
    const svg = svgRef.current;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse());
    const x = Math.floor((p.x / TW + p.y / TH) / 2);
    const y = Math.floor((p.y / TH - p.x / TW) / 2);
    return x >= 0 && y >= 0 && x < SIZE && y < SIZE ? { x, y } : null;
  };

  const valid = hover && canPlace(grid, hover.x, hover.y, tool);
  const building = tool && tool !== 'demolish';
  const ghostShadow = hover && valid && building ? shadowOf(tool, hover.x, hover.y, light) : null;

  // Piirtojärjestys takaa eteen (x + y), jotta lähempi rakennus peittää kauempana olevan
  const items = [];
  grid.forEach((type, i) => {
    if (!type || type === 'road') return;
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    items.push({ i, type, x, y, rot: rots[i] ?? autoRot(grid, x, y) });
  });
  if (hover && valid && building && tool !== 'road') {
    items.push({ i: 'ghost', type: tool, x: hover.x, y: hover.y, rot: previewRot, ghost: true });
  }
  items.sort((a, b) => a.x + a.y - (b.x + b.y) || (a.ghost ? 1 : 0) - (b.ghost ? 1 : 0));

  return (
    <svg
      ref={svgRef}
      className={`sb-board${tool === 'demolish' ? ' sb-board--demolish' : ''}`}
      viewBox={VIEW}
      aria-label="Kaupungin ruudukko"
      role="img"
      onPointerMove={(e) => e.pointerType === 'mouse' && onPoint(tileAt(e), e.buttons & 1 ? 'drag' : 'move')}
      onPointerLeave={(e) => e.pointerType === 'mouse' && onPoint(null, 'move')}
      onPointerUp={(e) => onPoint(tileAt(e), e.pointerType === 'mouse' ? 'click' : 'tap')}
    >
      <defs>
        <clipPath id="sb-board-clip">
          <polygon points={EDGE} />
        </clipPath>
      </defs>

      <polygon className="sb-board-side sb-board-side--left" points={SIDE_LEFT} />
      <polygon className="sb-board-side sb-board-side--right" points={SIDE_RIGHT} />
      <polygon className="sb-board-ground" points={EDGE} />

      <g className="sb-board-tiles">
        {grid.map((_, i) => (
          <polygon key={i} className="sb-board-tile" points={tilePoints(i % SIZE, Math.floor(i / SIZE))} />
        ))}
      </g>

      {/* Tiet maan tasossa, jotta varjot lankeavat niiden päälle */}
      <g>
        {grid.map((type, i) => {
          if (type !== 'road') return null;
          const x = i % SIZE;
          const y = Math.floor(i / SIZE);
          return <Building key={i} type="road" x={x} y={y} links={roadLinks(grid, x, y)} connected={linked.has(i)} />;
        })}
        {hover && valid && tool === 'road' && (
          <Building type="road" x={hover.x} y={hover.y} links={roadLinks(grid, hover.x, hover.y)} ghost />
        )}
      </g>

      {/* Varjot rajataan maahan, etteivät ne jatku taivaalle */}
      <g className="sb-board-shadows" clipPath="url(#sb-board-clip)" style={{ opacity: light.alpha }}>
        {shadows.map((s) => (
          <polygon key={s.i} points={toPoints(s.poly)} />
        ))}
        {ghostShadow && <polygon className="sb-board-shadow--ghost" points={toPoints(ghostShadow)} />}
      </g>

      {items.map((b) => (
        <Building
          key={b.ghost ? `ghost-${b.x}-${b.y}` : `${b.i}-${b.type}`}
          type={b.type}
          x={b.x}
          y={b.y}
          rot={b.rot}
          ghost={b.ghost}
          connected={!b.ghost && linked.has(b.i)}
          lit={b.type === 'solar' && light.sun && light.alpha > 0.05 && !shaded.has(b.i)}
        />
      ))}

      {hover && (
        <polygon
          className={`sb-board-cursor${valid ? '' : ' is-invalid'}`}
          points={tilePoints(hover.x, hover.y)}
        />
      )}
    </svg>
  );
}