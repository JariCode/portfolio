import './Zombie.css';

// Aloitusnäkymän ja alkuanimaation zombi: sama sprite-arkki kuin pelissä (zombies.js),
// joten zombit näyttävät joka paikassa samalta. Kävelyanimaatio tehdään CSS:llä:
// arkin kävelyrivi siirtyy ruutu kerrallaan sisemmän svg:n "ikkunan" läpi.
// variant: 'a' = zombi1, 'b' = zombi2, 'c' = zombi3, 'kid' = lapsizombi (zombi4)
const SHEETS = {
  a: { file: '/games/zrunner/zombi1.png', w: 179, h: 160, cols: 10, rows: 7, footY: 158 },
  b: { file: '/games/zrunner/zombi2.png', w: 179, h: 160, cols: 10, rows: 7, footY: 158 },
  c: { file: '/games/zrunner/zombi3.png', w: 179, h: 160, cols: 10, rows: 7, footY: 158 },
  kid: { file: '/games/zrunner/zombi4.png', w: 123, h: 117, cols: 10, rows: 7, footY: 115 },
};

const WALK_ROW = 1; // zombies.js: walk = rivi 1, 6 ruutua

export default function Zombie({ x, scale = 1, delay = 0, flip = false, variant = 'a' }) {
  const s = SHEETS[variant] ?? SHEETS.a;
  return (
    // Jalat kadulle (y = 885) kuten aiemmin; flip peilaa zombin katsomaan vasemmalle
    <g transform={`translate(${x} ${885 - s.footY * scale}) scale(${flip ? -scale : scale} ${scale})`}>
      <svg className="zr-z" width={s.w} height={s.h} viewBox={`0 0 ${s.w} ${s.h}`}>
        <image
          className="zr-z-sheet"
          href={s.file}
          width={s.w * s.cols}
          height={s.h * s.rows}
          y={-s.h * WALK_ROW}
          style={{ '--zr-delay': `${delay}s`, '--zr-step': `${-s.w * 6}px` }}
        />
      </svg>
    </g>
  );
}