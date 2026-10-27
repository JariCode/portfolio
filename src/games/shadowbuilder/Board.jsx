import { useEffect, useRef } from 'react';
import Building from './Building.jsx';
import { iso, TH, TW } from './iso.js';
import { autoRot, canPlace, connectedSet, HEIGHT, isHome, RANGE, roadLinks, SIZE } from './buildings.js';
import { growthOf } from './economy.js';
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

// Sähköä kuluttavat rakennukset pimenevät sähköpulassa
const USES_POWER = ['house', 'tower', 'shop'];

const VIEW = `${-SIZE * TW - 20} -70 ${SIZE * TW * 2 + 40} ${SIZE * TH * 2 + 70 + DEPTH + 20}`;

// rots: rakennusten käännöt (null = kääntyy tietä kohti). previewRot: esikatselun kääntö.
// chapter ja money ratkaisevat, voiko ruutuun rakentaa. dark: sähköpula, talojen valot sammuvat.
export default function Board({ grid, rots, previewRot, tool, hover, light, shadows, shaded, chapter, money, dark, onPoint }) {
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

  const valid = hover && canPlace(grid, hover.x, hover.y, tool, chapter, money);
  const building = tool && tool !== 'demolish';
  const ghostShadow = hover && valid && building ? shadowOf(tool, hover.x, hover.y, light) : null;

  // Piirtojärjestys takaa eteen (x + y), jotta lähempi rakennus peittää kauempana olevan
  const items = [];
  grid.forEach((type, i) => {
    if (!type || type === 'road' || type === 'grass') return;
    const x = i % SIZE;
    const y = Math.floor(i / SIZE);
    items.push({ i, type, x, y, rot: rots[i] ?? autoRot(grid, x, y) });
  });
  if (hover && valid && building && tool !== 'road' && tool !== 'grass') {
    items.push({ i: 'ghost', type: tool, x: hover.x, y: hover.y, rot: previewRot, ghost: true });
  }
  items.sort((a, b) => a.x + a.y - (b.x + b.y) || (a.ghost ? 1 : 0) - (b.ghost ? 1 : 0));

  // Vaikutusalue: nurmea, puistoa, kauppaa tai voimalaa esikatsellessa hehkuvat ruudut, joihin
  // vaikutus ulottuu, ja talojen päällä näkyy, paljonko niiden kasvu muuttuisi (+1/yö)
  const range = hover && valid ? RANGE[tool] : null;
  const area = [];
  const badges = [];
  if (range) {
    const next = [...grid];
    next[hover.y * SIZE + hover.x] = tool;
    for (let dy = -range.r; dy <= range.r; dy++) {
      for (let dx = -range.r; dx <= range.r; dx++) {
        const x = hover.x + dx;
        const y = hover.y + dy;
        if ((!dx && !dy) || x < 0 || y < 0 || x >= SIZE || y >= SIZE) continue;
        if (range.adjacent && dx && dy) continue;
        area.push([x, y]);
        const i = y * SIZE + x;
        if (isHome(grid[i])) {
          const delta = growthOf(next, i) - growthOf(grid, i);
          if (delta) badges.push({ i, x, y, delta, z: HEIGHT[grid[i]] });
        }
      }
    }
  }

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

      {/* Tiet ja nurmi maan tasossa, jotta varjot lankeavat niiden päälle */}
      <g>
        {grid.map((type, i) => {
          if (type !== 'road' && type !== 'grass') return null;
          const x = i % SIZE;
          const y = Math.floor(i / SIZE);
          return <Building key={`${i}-${type}`} type={type} x={x} y={y} links={type === 'road' ? roadLinks(grid, x, y) : []} />;
        })}
        {hover && valid && (tool === 'road' || tool === 'grass') && (
          <Building type={tool} x={hover.x} y={hover.y} links={tool === 'road' ? roadLinks(grid, hover.x, hover.y) : []} ghost />
        )}
      </g>

      {/* Varjot rajataan maahan, etteivät ne jatku taivaalle */}
      <g className="sb-board-shadows" clipPath="url(#sb-board-clip)" style={{ opacity: light.alpha }}>
        {shadows.map((s) => (
          <polygon key={s.i} points={toPoints(s.poly)} />
        ))}
        {ghostShadow && <polygon className="sb-board-shadow--ghost" points={toPoints(ghostShadow)} />}
      </g>

      {/* Vaikutusalue maassa, rakennusten alla */}
      {area.length > 0 && (
        <g className={`sb-board-range${range.effect < 0 ? ' is-bad' : ''}`}>
          {area.map(([x, y]) => (
            <polygon key={`${x},${y}`} points={tilePoints(x, y)} />
          ))}
        </g>
      )}

      {items.map((b) => (
        <Building
          key={b.ghost ? `ghost-${b.x}-${b.y}` : `${b.i}-${b.type}`}
          type={b.type}
          x={b.x}
          y={b.y}
          rot={b.rot}
          ghost={b.ghost}
          connected={!b.ghost && linked.has(b.i) && !(dark && USES_POWER.includes(b.type))}
          lit={b.type === 'solar' && light.sun && light.alpha > 0.05 && !shaded.has(b.i)}
        />
      ))}

      {/* Kasvun muutos talojen päällä */}
      {badges.map((b) => {
        const [bx2, by2] = iso(b.x + 0.5, b.y + 0.5, b.z + 0.45);
        return (
          <text key={b.i} className={`sb-board-badge${b.delta < 0 ? ' is-bad' : ''}`} x={bx2} y={by2}>
            {b.delta > 0 ? `+${b.delta}` : `−${-b.delta}`}/yö
          </text>
        );
      })}

      {hover && (
        <polygon
          className={`sb-board-cursor${valid ? '' : ' is-invalid'}`}
          points={tilePoints(hover.x, hover.y)}
        />
      )}
    </svg>
  );
}