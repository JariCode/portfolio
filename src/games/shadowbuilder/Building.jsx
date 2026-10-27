import { INSET } from './shadows.js';
import { iso } from './iso.js';

// Rakennusten SVG-piirrokset isometrisessä projektiossa. Rakennus on laatikoita ja
// monikulmioita: kaksi näkyvää seinää ja katto. Ikkunat syttyvät, kun rakennuksella on
// tieyhteys raatihuoneeseen ja sähköä riittää (connected); valokenno hehkuu vain valossa (lit).
//
// rot (0–3) kääntää rakennuksen julkisivun: 0 = kohti katsojaa vasemmalle (+y), 3 = oikealle
// (+x), 1 ja 2 = poispäin. Näkyvät seinät ovat aina samat (+y ja +x), joten kääntö vaihtaa
// vain sen, mille seinälle ovi, ikkunat ja kyltti piirretään ja mihin suuntaan katto ja
// kenno kallistuvat. Pohja on neliö, joten kääntö ei muuta varjoa.

// Monikulmion pisteet ruudukosta näytölle (yksi desimaali riittää)
const pts = (list) => list.map((p) => iso(...p).map((n) => Math.round(n * 10) / 10).join(',')).join(' ');

// Julkisivun suunta ruudukossa kullekin käännölle
const FACING = [
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 0],
];

// Julkisivu näkyvällä seinällä (L = +y, R = +x) tai null, jos se on poispäin
const FRONT = ['L', null, null, 'R'];
// Takaseinä näkyvissä, kun julkisivu on poispäin
const BACK = [null, 'R', 'L', null];

// Paikallinen piste (u, v) ruudun sisällä käännettynä keskipisteen ympäri
function turn(u, v, rot) {
  if (rot === 1) return [1 - v, u];
  if (rot === 2) return [1 - u, 1 - v];
  if (rot === 3) return [v, 1 - u];
  return [u, v];
}

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

// Suorakulmio näkyvälle seinälle: u = paikka seinän suunnassa (0–1), z = korkeus
function onFace(face, f, u0, u1, z0, z1) {
  if (face === 'L') {
    const a = f.x0 + (f.x1 - f.x0) * u0;
    const b = f.x0 + (f.x1 - f.x0) * u1;
    return pts([[a, f.y1, z0], [b, f.y1, z0], [b, f.y1, z1], [a, f.y1, z1]]);
  }
  const a = f.y0 + (f.y1 - f.y0) * u0;
  const b = f.y0 + (f.y1 - f.y0) * u1;
  return pts([[f.x1, a, z0], [f.x1, b, z0], [f.x1, b, z1], [f.x1, a, z1]]);
}

const other = (face) => (face === 'L' ? 'R' : 'L');

function House({ f, rot, win }) {
  const { x0, y0, x1, y1 } = f;
  const wall = 0.58;
  const ridge = 0.95;
  const front = FRONT[rot];
  const back = BACK[rot];
  // Harja kulkee julkisivun suuntaisesti: julkisivu y-seinällä → harja x-suunnassa
  const ridgeX = rot === 0 || rot === 2;
  const ym = (y0 + y1) / 2;
  const xm = (x0 + x1) / 2;
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, wall)} />
      {ridgeX ? (
        <>
          <polygon className="sb-b-roof-back" points={pts([[x0, y0, wall], [x1, y0, wall], [x1, ym, ridge], [x0, ym, ridge]])} />
          <polygon className="sb-b-right" points={pts([[x1, y0, wall], [x1, y1, wall], [x1, ym, ridge]])} />
          <polygon className="sb-b-roof" points={pts([[x0, y1, wall], [x1, y1, wall], [x1, ym, ridge], [x0, ym, ridge]])} />
        </>
      ) : (
        <>
          <polygon className="sb-b-roof-back" points={pts([[x0, y0, wall], [x0, y1, wall], [xm, y1, ridge], [xm, y0, ridge]])} />
          <polygon className="sb-b-roof" points={pts([[x1, y0, wall], [x1, y1, wall], [xm, y1, ridge], [xm, y0, ridge]])} />
          <polygon className="sb-b-left" points={pts([[x0, y1, wall], [x1, y1, wall], [xm, y1, ridge]])} />
        </>
      )}
      {front ? (
        <>
          {/* Julkisivu: ovi keskellä, ikkunat sen molemmin puolin; sivuseinällä yksi ikkuna */}
          <polygon className={win} points={onFace(front, f, 0.12, 0.32, 0.26, 0.44)} />
          <polygon className="sb-b-door" points={onFace(front, f, 0.42, 0.58, 0, 0.32)} />
          <polygon className={win} points={onFace(front, f, 0.68, 0.88, 0.26, 0.44)} />
          <polygon className={win} points={onFace(other(front), f, 0.32, 0.68, 0.24, 0.42)} />
        </>
      ) : (
        <>
          {/* Julkisivu poispäin: takaseinällä kaksi ikkunaa, sivuseinällä yksi */}
          <polygon className={win} points={onFace(back, f, 0.16, 0.38, 0.24, 0.42)} />
          <polygon className={win} points={onFace(back, f, 0.62, 0.84, 0.24, 0.42)} />
          <polygon className={win} points={onFace(other(back), f, 0.32, 0.68, 0.24, 0.42)} />
        </>
      )}
    </>
  );
}

// Kerrostalo: korkea laatikko, ikkunarivit molemmilla seinillä, ovi julkisivussa,
// katolla kaide ja antenni, jonka päässä pieni valo
function Tower({ f, rot, win }) {
  const { x0, y0, x1, y1 } = f;
  const h = 2.0;
  const front = FRONT[rot] ?? BACK[rot];
  const [ax, ay] = iso((x0 + x1) / 2, (y0 + y1) / 2, h + 0.06);
  const [, at] = iso((x0 + x1) / 2, (y0 + y1) / 2, h + 0.5);
  const rows = [0.42, 0.74, 1.06, 1.38, 1.7];
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, h)} />
      <Box b={box(x0 + 0.05, y0 + 0.05, x1 - 0.05, y1 - 0.05, h, h + 0.06)} className="sb-b-parapet" />
      {rows.map((z) =>
        ['L', 'R'].map((face) =>
          [0.14, 0.42, 0.7].map((u) => (
            <polygon key={`${face}${z}${u}`} className={win} points={onFace(face, f, u, u + 0.16, z, z + 0.18)} />
          )),
        ),
      )}
      {FRONT[rot] && <polygon className="sb-b-door" points={onFace(front, f, 0.4, 0.6, 0, 0.3)} />}
      <line className="sb-b-spire" x1={ax} y1={ay} x2={ax} y2={at} />
      <circle className="sb-b-beacon" cx={ax} cy={at} r="2.6" />
    </>
  );
}

// Nurmi: koko ruudun nurmikko ja muutama ruohotupsu
function Grass({ x, y }) {
  const tufts = [
    [0.25, 0.3],
    [0.7, 0.25],
    [0.45, 0.55],
    [0.2, 0.75],
    [0.75, 0.7],
  ];
  return (
    <>
      <polygon className="sb-b-grass" points={pts([[x, y, 0], [x + 1, y, 0], [x + 1, y + 1, 0], [x, y + 1, 0]])} />
      {tufts.map(([u, v]) => {
        const [cx, cy] = iso(x + u, y + v, 0);
        return <path key={`${u}${v}`} className="sb-b-tuft" d={`M${cx - 3} ${cy} l1 -4 M${cx} ${cy} v-5 M${cx + 3} ${cy} l-1 -4`} />;
      })}
    </>
  );
}

function Shop({ f, rot, win, connected }) {
  const { x0, y0, x1, y1 } = f;
  const h = 0.72;
  const front = FRONT[rot];
  // Kyltti näkyy aina: julkisivulla tai, jos julkisivu on poispäin, takaseinällä
  const signFace = front ?? BACK[rot];
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, h)} />
      <Box b={box(x0 + 0.04, y0 + 0.04, x1 - 0.04, y1 - 0.04, h, h + 0.06)} className="sb-b-parapet" />
      {front ? (
        <polygon className={win} points={onFace(front, f, 0.1, 0.9, 0.06, 0.36)} />
      ) : (
        <polygon className={win} points={onFace(signFace, f, 0.2, 0.8, 0.22, 0.36)} />
      )}
      <polygon className={win} points={onFace(other(signFace), f, 0.2, 0.8, 0.2, 0.36)} />
      {/* Neonkyltti syttyy, kun kauppa on yhteydessä raatihuoneeseen */}
      <polygon className={connected ? 'sb-b-sign is-on' : 'sb-b-sign'} points={onFace(signFace, f, 0.16, 0.84, 0.46, 0.6)} />
    </>
  );
}

function Solar({ f, rot, lit }) {
  const { x0, y0, x1, y1 } = f;
  const [dx, dy] = FACING[rot];
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const half = (x1 - x0) / 2;
  // Kenno kallistuu julkisivun suuntaan: takareuna korkealla, etureuna matalalla
  const z = (x, y) => 0.24 - 0.16 * ((((x - cx) * dx + (y - cy) * dy) / half + 1) / 2);
  const corner = (x, y) => [x, y, z(x, y)];
  const base = 0.06;
  return (
    <>
      <Box b={box(x0, y0, x1, y1, 0, base)} />
      <polygon className="sb-b-left" points={pts([[x0, y1, base], [x1, y1, base], corner(x1, y1), corner(x0, y1)])} />
      <polygon className="sb-b-right" points={pts([[x1, y0, base], [x1, y1, base], corner(x1, y1), corner(x1, y0)])} />
      <polygon
        className={lit ? 'sb-b-panel is-lit' : 'sb-b-panel'}
        points={pts([corner(x0, y0), corner(x1, y0), corner(x1, y1), corner(x0, y1)])}
      />
      <path
        className="sb-b-panel-grid"
        d={`M${iso(...corner(cx, y0))} L${iso(...corner(cx, y1))} M${iso(...corner(x0, cy))} L${iso(...corner(x1, cy))}`}
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

// Paikallinen piste (u, v) ruudun sisältä käännettynä ruudukon koordinaateiksi
const local = (f, rot) => (u, v) => {
  const [a, b] = turn(u, v, rot);
  return [f.x0 + (f.x1 - f.x0) * a, f.y0 + (f.y1 - f.y0) * b];
};

function Park({ f, rot, connected }) {
  const at = local(f, rot);
  // Puut piirretään takaa eteen, jotta lähempi latvus peittää kauemman
  const trees = [
    [0.26, 0.26, 0.55],
    [0.78, 0.36, 0.48],
    [0.62, 0.8, 0.5],
  ]
    .map(([u, v, z]) => [...at(u, v), z])
    .sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
  const [px, py] = at(0.2, 0.78);
  const [lx, ly] = iso(px, py, 0);
  const [, lt] = iso(px, py, 0.42);
  return (
    <>
      <polygon className="sb-b-lawn" points={pts([[f.x0, f.y0, 0], [f.x1, f.y0, 0], [f.x1, f.y1, 0], [f.x0, f.y1, 0]])} />
      {trees.map(([x, y, z]) => (
        <Tree key={`${x}${y}`} x={x} y={y} z={z} />
      ))}
      {/* Lyhty: syttyy, kun puisto on yhteydessä */}
      <line className="sb-b-trunk" x1={lx} y1={ly} x2={lx} y2={lt} />
      <circle className={connected ? 'sb-b-lamp is-on' : 'sb-b-lamp'} cx={lx} cy={lt} r="3.4" />
    </>
  );
}

// Sienitarha: matala katos, jonka alla hehkuvat sienet (kasvavat varjossa)
function Mushroom({ f, rot }) {
  const at = local(f, rot);
  const caps = [
    [0.3, 0.35],
    [0.62, 0.3],
    [0.45, 0.66],
  ].map(([u, v]) => at(u, v));
  return (
    <>
      <polygon className="sb-b-lawn sb-b-lawn--dark" points={pts([[f.x0, f.y0, 0], [f.x1, f.y0, 0], [f.x1, f.y1, 0], [f.x0, f.y1, 0]])} />
      {caps.map(([x, y]) => {
        const [cx, cy] = iso(x, y, 0);
        return (
          <g key={`${x}${y}`}>
            <line className="sb-b-stem" x1={cx} y1={cy} x2={cx} y2={cy - 7} />
            <ellipse className="sb-b-cap" cx={cx} cy={cy - 8} rx="7" ry="4" />
          </g>
        );
      })}
    </>
  );
}

// Voimala: tehdashalli ja savupiippu, julkisivussa (tai takaseinällä) neonsalama
function Power({ f, rot }) {
  const at = local(f, rot);
  const [cx, cy] = at(0.8, 0.2);
  const [px, py] = iso(cx, cy, 0.62);
  const [, pt] = iso(cx, cy, 1.3);
  const face = FRONT[rot] ?? BACK[rot];
  // Salama seinän tasossa: u seinän suunnassa, z korkeus
  const bolt = (u, z) => {
    if (face === 'L') return iso(f.x0 + (f.x1 - f.x0) * u, f.y1, z);
    return iso(f.x1, f.y0 + (f.y1 - f.y0) * u, z);
  };
  return (
    <>
      <Box b={box(f.x0, f.y0, f.x1, f.y1, 0, 0.62)} />
      <line className="sb-b-chimney" x1={px} y1={py} x2={px} y2={pt} />
      <path className="sb-b-bolt" d={`M${bolt(0.42, 0.52)} L${bolt(0.3, 0.3)} L${bolt(0.5, 0.32)} L${bolt(0.38, 0.1)}`} />
    </>
  );
}

function Hall({ x, y }) {
  const a = x + 0.08;
  const b = x + 0.92;
  const c = y + 0.08;
  const d = y + 0.92;
  const top = 1.0;
  const f = { x0: a, y0: c, x1: b, y1: d };
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
        <polygon key={u} className="sb-b-win is-on" points={onFace('L', f, u, u + 0.16, 0.5, 0.78)} />
      ))}
      <polygon className="sb-b-door" points={onFace('L', f, 0.4, 0.6, 0, 0.36)} />
      {[0.18, 0.62].map((u) => (
        <polygon key={u} className="sb-b-win is-on" points={onFace('R', f, u, u + 0.2, 0.5, 0.78)} />
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

// type: rakennuksen id. rot: julkisivun suunta. links: tien suunnat (roadLinks).
// ghost: esikatselu (ei nousuanimaatiota).
export default function Building({ type, x, y, rot = 0, connected = false, lit = false, links = [], ghost = false }) {
  const f = { x0: x + INSET, y0: y + INSET, x1: x + 1 - INSET, y1: y + 1 - INSET };
  const win = connected ? 'sb-b-win is-on' : 'sb-b-win';
  const [ox, oy] = iso(x + 0.5, y + 0.5);
  const cls = ['sb-b', `sb-b--${type}`, ghost && 'is-ghost'].filter(Boolean).join(' ');

  return (
    <g className={cls} style={{ transformOrigin: `${ox}px ${oy}px` }}>
      {type === 'road' && <Road x={x} y={y} links={links} />}
      {type === 'grass' && <Grass x={x} y={y} />}
      {type === 'house' && <House f={f} rot={rot} win={win} />}
      {type === 'tower' && <Tower f={f} rot={rot} win={win} />}
      {type === 'shop' && <Shop f={f} rot={rot} win={win} connected={connected} />}
      {type === 'solar' && <Solar f={f} rot={rot} lit={lit} />}
      {type === 'park' && <Park f={f} rot={rot} connected={connected} />}
      {type === 'mushroom' && <Mushroom f={f} rot={rot} />}
      {type === 'power' && <Power f={f} rot={rot} />}
      {type === 'hall' && <Hall x={x} y={y} />}
    </g>
  );
}