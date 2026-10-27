import { INSET } from './shadows.js';
import { iso } from './iso.js';

// Rakennusten SVG-piirrokset isometrisessä projektiossa. Rakennus on laatikoita ja
// monikulmioita: kaksi näkyvää seinää ja katto. Ikkunat syttyvät, kun rakennuksella on
// tieyhteys raatihuoneeseen (connected); valokenno hehkuu vain valossa (lit).

// Monikulmion pisteet ruudukosta näytölle (yksi desimaali riittää)
const pts = (list) => list.map((p) => iso(...p).map((n) => Math.round(n * 10) / 10).join(',')).join(' ');

// Laatikon näkyvät pinnat: vasen seinä (y = y1), oikea seinä (x = x1) ja katto
function box(x0, y0, x1, y1, z0, z1) {
  return {
    left: pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]),
    right: pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]),
    top: pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]),
  };
}

function Box({ b, className = '' }) {
  return (
    <>
      <polygon className={`sb-b-left ${className}`} points={b.left} />
      <polygon className={`sb-b-right ${className}`} points={b.right} />
      <polygon className={`sb-b-top ${className}`} points={b.top} />
    </>
  );
}

// Ikkuna seinälle: u = paikka seinän suunnassa (0–1), z = korkeus
function windowLeft(x0, x1, y1, u0, u1, z0, z1) {
  const a = x0 + (x1 - x0) * u0;
  const b = x0 + (x1 - x0) * u1;
  return pts([[a, y1, z0], [b, y1, z0], [b, y1, z1], [a, y1, z1]]);
}

function windowRight(y0, y1, x1, u0, u1, z0, z1) {
  const a = y0 + (y1 - y0) * u0;
  const b = y0 + (y1 - y0) * u1;
  return pts([[x1, a, z0], [x1, b, z0], [x1, b, z1], [x1, a, z1]]);
}

function House({ x0, y0, x1, y1, win }) {
  const ym = (y0 + y1) / 2;
  const wall = 0.58;
  const ridge = 0.95;
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, wall)} />
      {/* Harjakatto: takalape, päätykolmio ja etulape */}
      <polygon className="sb-b-roof-back" points={pts([[x0, y0, wall], [x1, y0, wall], [x1, ym, ridge], [x0, ym, ridge]])} />
      <polygon className="sb-b-right" points={pts([[x1, y0, wall], [x1, y1, wall], [x1, ym, ridge]])} />
      <polygon className="sb-b-roof" points={pts([[x0, y1, wall], [x1, y1, wall], [x1, ym, ridge], [x0, ym, ridge]])} />
      <polygon className={win} points={windowLeft(x0, x1, y1, 0.14, 0.34, 0.26, 0.44)} />
      <polygon className="sb-b-door" points={windowLeft(x0, x1, y1, 0.48, 0.64, 0, 0.32)} />
      <polygon className={win} points={windowLeft(x0, x1, y1, 0.76, 0.92, 0.26, 0.44)} />
      <polygon className={win} points={windowRight(y0, y1, x1, 0.32, 0.68, 0.24, 0.42)} />
    </>
  );
}

function Shop({ x0, y0, x1, y1, win, connected }) {
  const h = 0.72;
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, h)} />
      {/* Kattokaide ja leveä näyteikkuna */}
      <Box b={box(x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04, h, h + 0.06)} className="sb-b-parapet" />
      <polygon className={win} points={windowLeft(x0, x1, y1, 0.1, 0.9, 0.06, 0.36)} />
      <polygon className={win} points={windowRight(y0, y1, x1, 0.2, 0.8, 0.2, 0.36)} />
      {/* Neonkyltti syttyy, kun kauppa on yhteydessä raatihuoneeseen */}
      <polygon
        className={connected ? 'sb-b-sign is-on' : 'sb-b-sign'}
        points={windowLeft(x0, x1, y1, 0.16, 0.84, 0.46, 0.6)}
      />
    </>
  );
}

function Solar({ x0, y0, x1, y1, lit }) {
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, 0.06)} />
      {/* Kenno kallistuu kohti katsojaa; hehkuu vain valossa */}
      <polygon className="sb-b-right" points={pts([[x1, y0, 0.06], [x1, y1, 0.06], [x1, y1 - 0.08, 0.1], [x1, y0, 0.24]])} />
      <polygon
        className={lit ? 'sb-b-panel is-lit' : 'sb-b-panel'}
        points={pts([[x0, y0, 0.24], [x1, y0, 0.24], [x1, y1 - 0.08, 0.1], [x0, y1 - 0.08, 0.1]])}
      />
      <path
        className="sb-b-panel-grid"
        d={`M${iso((x0 + x1) / 2, y0, 0.24)} L${iso((x0 + x1) / 2, y1 - 0.08, 0.1)} M${iso(x0, (y0 + y1 - 0.08) / 2, 0.17)} L${iso(x1, (y0 + y1 - 0.08) / 2, 0.17)}`}
      />
    </>
  );
}

// Puu: runko ja latvus; latvuksen korkeus z
function Tree({ x, y, z }) {
  const [bx, by] = iso(x, y, 0);
  const [, ty] = iso(x, y, z);
  return (
    <>
      <line className="sb-b-trunk" x1={bx} y1={by} x2={bx} y2={ty + 6} />
      <ellipse className="sb-b-crown" cx={bx} cy={ty} rx="11" ry="12" />
    </>
  );
}

function Park({ x0, y0, x1, y1, connected }) {
  const [lx, ly] = iso(x0 + 0.2, y1 - 0.22, 0);
  const [, lt] = iso(x0 + 0.2, y1 - 0.22, 0.42);
  return (
    <>
      <polygon className="sb-b-lawn" points={pts([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])} />
      <Tree x={x0 + 0.26} y={y0 + 0.26} z={0.55} />
      <Tree x={x1 - 0.22} y={y0 + 0.36} z={0.48} />
      <Tree x={x0 + 0.62} y={y1 - 0.2} z={0.5} />
      {/* Lyhty: syttyy, kun puisto on yhteydessä */}
      <line className="sb-b-trunk" x1={lx} y1={ly} x2={lx} y2={lt} />
      <circle className={connected ? 'sb-b-lamp is-on' : 'sb-b-lamp'} cx={lx} cy={lt} r="3.4" />
    </>
  );
}

// Sienitarha: matala katos, jonka alla hehkuvat sienet (kasvavat varjossa)
function Mushroom({ x0, y0, x1, y1 }) {
  const caps = [
    [0.3, 0.35],
    [0.62, 0.3],
    [0.45, 0.66],
  ];
  return (
    <>
      <polygon className="sb-b-lawn sb-b-lawn--dark" points={pts([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]])} />
      {caps.map(([u, v]) => {
        const [cx, cy] = iso(x0 + (x1 - x0) * u, y0 + (y1 - y0) * v, 0);
        return (
          <g key={`${u}${v}`}>
            <line className="sb-b-stem" x1={cx} y1={cy} x2={cx} y2={cy - 7} />
            <ellipse className="sb-b-cap" cx={cx} cy={cy - 8} rx="7" ry="4" />
          </g>
        );
      })}
    </>
  );
}

// Voimala: tehdashalli ja savupiippu, kyljessä neonsalama
function Power({ x0, y0, x1, y1 }) {
  const [px, py] = iso(x1 - 0.18, y0 + 0.2, 0.62);
  const [, pt] = iso(x1 - 0.18, y0 + 0.2, 1.3);
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, 0.62)} />
      <line className="sb-b-chimney" x1={px} y1={py} x2={px} y2={pt} />
      <path
        className="sb-b-bolt"
        d={`M${iso(x0 + 0.42, y1, 0.52)} L${iso(x0 + 0.3, y1, 0.3)} L${iso(x0 + 0.5, y1, 0.32)} L${iso(x0 + 0.38, y1, 0.1)}`}
      />
    </>
  );
}

function Hall({ x, y }) {
  const a = x + 0.08;
  const b = x + 0.92;
  const c = y + 0.08;
  const d = y + 0.92;
  const top = 1.0;
  const [sx, sy] = iso(x + 0.5, y + 0.5, 1.72);
  return (
    <>
      <Box b={box(a, c, b, d, 0, top)} />
      {/* Pyramidikatto ja torni, jonka päässä hehkuu valopallo kuten vartijan sauvassa */}
      <polygon className="sb-b-roof" points={pts([[a, d, top], [b, d, top], [x + 0.5, y + 0.5, 1.42]])} />
      <polygon className="sb-b-right" points={pts([[b, c, top], [b, d, top], [x + 0.5, y + 0.5, 1.42]])} />
      <line className="sb-b-spire" x1={sx} y1={iso(x + 0.5, y + 0.5, 1.42)[1]} x2={sx} y2={sy} />
      <circle className="sb-b-orb-glow" cx={sx} cy={sy} r="12" />
      <circle className="sb-b-orb" cx={sx} cy={sy} r="4" />
      {[0.14, 0.42, 0.7].map((u) => (
        <polygon key={u} className="sb-b-win is-on" points={windowLeft(a, b, d, u, u + 0.16, 0.5, 0.78)} />
      ))}
      <polygon className="sb-b-door" points={windowLeft(a, b, d, 0.4, 0.6, 0, 0.36)} />
      {[0.18, 0.62].map((u) => (
        <polygon key={u} className="sb-b-win is-on" points={windowRight(c, d, b, u, u + 0.2, 0.5, 0.78)} />
      ))}
    </>
  );
}

const NEXT = { '1,0': [1, 0.5], '-1,0': [0, 0.5], '0,1': [0.5, 1], '0,-1': [0.5, 0] };

function Road({ x, y, links }) {
  const [cx, cy] = iso(x + 0.5, y + 0.5);
  return (
    <>
      <polygon className="sb-b-road" points={pts([[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]])} />
      {links.map(([dx, dy]) => {
        const [u, v] = NEXT[`${dx},${dy}`];
        const [ex, ey] = iso(x + u, y + v);
        return <line key={`${dx},${dy}`} className="sb-b-road-line" x1={cx} y1={cy} x2={ex} y2={ey} />;
      })}
      {links.length === 0 && <circle className="sb-b-road-line" cx={cx} cy={cy} r="2" />}
    </>
  );
}

// type: rakennuksen id. links: tien suunnat (roadLinks). ghost: esikatselu (ei nousuanimaatiota).
export default function Building({ type, x, y, connected = false, lit = false, links = [], ghost = false }) {
  const x0 = x + INSET;
  const y0 = y + INSET;
  const x1 = x + 1 - INSET;
  const y1 = y + 1 - INSET;
  const win = connected ? 'sb-b-win is-on' : 'sb-b-win';
  const [ox, oy] = iso(x + 0.5, y + 0.5);
  const cls = ['sb-b', `sb-b--${type}`, ghost && 'is-ghost'].filter(Boolean).join(' ');

  return (
    <g className={cls} style={{ transformOrigin: `${ox}px ${oy}px` }}>
      {type === 'road' && <Road x={x} y={y} links={links} />}
      {type === 'house' && <House x0={x0} y0={y0} x1={x1} y1={y1} win={win} />}
      {type === 'shop' && <Shop x0={x0} y0={y0} x1={x1} y1={y1} win={win} connected={connected} />}
      {type === 'solar' && <Solar x0={x0} y0={y0} x1={x1} y1={y1} lit={lit} />}
      {type === 'park' && <Park x0={x0} y0={y0} x1={x1} y1={y1} connected={connected} />}
      {type === 'mushroom' && <Mushroom x0={x0} y0={y0} x1={x1} y1={y1} />}
      {type === 'power' && <Power x0={x0} y0={y0} x1={x1} y1={y1} />}
      {type === 'hall' && <Hall x={x} y={y} />}
    </g>
  );
}