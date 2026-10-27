import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import City from './City.jsx';
import Board from './Board.jsx';
import Toolbar from './Toolbar.jsx';
import Guide from './Guide.jsx';
import MuteButton from './MuteButton.jsx';
import { autoRot, canPlace, connectedSet, emptyGrid, rotatable, SIZE, TOOLS } from './buildings.js';
import { castShadows, DAY, lightAt } from './shadows.js';
import { nextLine } from './story.js';
import { play } from './sound.js';
import { clearCity, saveCity } from './score.js';
import './Game.css';

// Valon kulku päivitetään noin 20 kertaa sekunnissa: varjot liikkuvat hitaasti, joten
// tiheämpi päivitys ei näkyisi, mutta piirtäisi turhaan.
const TICK = 50;
// Peli alkaa aamupäivästä, jolloin varjot osuvat selvästi maahan
const START = 0.12;

// Kuinka kauan vartijan puhekupla pysyy: perusaika ja lisäaika merkkiä kohden
const bubbleTime = (text) => 3800 + text.length * 55;

// saved: tallennettu kaupunki (score.js), josta peli jatkuu, tai null uudessa pelissä
export default function Game({ onExit, saved }) {
  const [grid, setGrid] = useState(() => saved?.grid ?? emptyGrid());
  // Käännöt ruuduittain: null = rakennus kääntyy itsestään kohti tietä, 0–3 = pelaajan valinta
  const [rots, setRots] = useState(() => saved?.rots ?? Array(SIZE * SIZE).fill(null));
  const [tool, setTool] = useState('road');
  // Seuraavan rakennuksen kääntö: null = automaattinen, 0–3 = käännetty R:llä tai napilla
  const [rotMode, setRotMode] = useState(null);
  const [hover, setHover] = useState(null);
  const [paused, setPaused] = useState(false);
  const [t, setT] = useState(saved?.t ?? START);
  const [line, setLine] = useState(null);
  const [seen, setSeen] = useState(() => new Set(saved?.seen ?? []));
  const clock = useRef((saved?.t ?? START) * DAY);

  // ── Aika: valo kulkee, paitsi tauolla ──
  useEffect(() => {
    if (paused) return undefined;
    let last = performance.now();
    let sent = 0;
    let frame = requestAnimationFrame(function step(now) {
      // Välilehden ollessa taustalla kertynyt aika ei hyppää valoa eteenpäin
      clock.current += Math.min(now - last, 100) / 1000;
      last = now;
      if (now - sent >= TICK) {
        sent = now;
        setT((clock.current / DAY) % 1);
      }
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  const light = useMemo(() => lightAt(t), [t]);
  const { shadows, shaded } = useMemo(() => castShadows(grid, light), [grid, light]);

  // ── Rakentaminen ──
  const build = useCallback(
    (x, y) => {
      if (!canPlace(grid, x, y, tool)) return;
      const i = y * SIZE + x;
      const next = [...grid];
      next[i] = tool === 'demolish' ? null : tool;
      const nextRots = [...rots];
      nextRots[i] = rotatable(tool) ? rotMode : null;
      setGrid(next);
      setRots(nextRots);
      play(tool === 'demolish' ? 'demolish' : 'build', { rate: tool === 'road' ? 1.4 : 1 });
    },
    [grid, rots, tool, rotMode],
  );

  // Esikatselun kääntö: pelaajan valinta tai automaattisesti kohti tietä
  const previewRot = hover && rotatable(tool) ? (rotMode ?? autoRot(grid, hover.x, hover.y)) : 0;

  // R tai kääntönappi: käännetään esikatselua 90° siitä, mihin se nyt osoittaa
  const rotate = useCallback(() => {
    if (!rotatable(tool)) return;
    setRotMode((r) => ((r ?? (hover ? autoRot(grid, hover.x, hover.y) : 0)) + 1) % 4);
  }, [tool, hover, grid]);

  // ── Tallennus: jokaisen rakennuksen ja purun jälkeen (sekä uuden repliikin jälkeen) ──
  // Pelkkä raatihuone ei ole tallennettava kaupunki, joten tyhjä kaupunki poistetaan.
  useEffect(() => {
    if (grid.some((g) => g && g !== 'hall')) {
      saveCity({ grid, rots, seen: [...seen], t: (clock.current / DAY) % 1 });
    } else {
      clearCity();
    }
  }, [grid, rots, seen]);

  // Hiiri: liike esikatselee, painallus rakentaa, tietä voi vetää painike pohjassa.
  // Kosketus: ensimmäinen napautus esikatselee, toinen samaan ruutuun rakentaa.
  const onPoint = (tile, kind) => {
    if (kind === 'move') {
      setHover(tile);
    } else if (kind === 'drag') {
      setHover(tile);
      if (tile && tool === 'road') build(tile.x, tile.y);
    } else if (kind === 'click') {
      if (tile) build(tile.x, tile.y);
    } else if (tile) {
      if (hover && hover.x === tile.x && hover.y === tile.y) build(tile.x, tile.y);
      else setHover(tile);
    } else {
      setHover(null);
    }
  };

  // Työkalun vaihto palauttaa käännön automaattiseksi
  const select = useCallback((id) => {
    if (!TOOLS.find((x) => x.id === id && !x.locked)) return;
    setTool(id);
    setRotMode(null);
  }, []);

  // ── Näppäimet: numerot valitsevat, R kääntää, Delete purkaa, välilyönti tauko. Esc sulkee pelin. ──
  useEffect(() => {
    const onKey = (e) => {
      const byKey = TOOLS.find((x) => x.key === e.key);
      if (byKey) select(byKey.id);
      else if (e.key === 'Backspace') select('demolish');
      else if (e.code === 'KeyR' && !e.repeat) rotate();
      else if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select, rotate]);

  // ── Tilanne vartijan repliikkejä varten ──
  // Tiivistetään merkkijonoksi, jotta valon tasainen liike ei käynnistä repliikkien
  // tarkistusta uudelleen: muutos tulee vain, kun jokin luku oikeasti muuttuu.
  const linked = connectedSet(grid);
  const count = (type) => grid.filter((g) => g === type).length;
  const statsKey = JSON.stringify({
    road: count('road'),
    house: count('house'),
    shop: count('shop'),
    solar: count('solar'),
    park: count('park'),
    buildings: grid.filter((g) => g && g !== 'road' && g !== 'hall').length,
    unlinked: grid.filter((g, i) => g && g !== 'road' && g !== 'hall' && !linked.has(i)).length,
    linkedHouse: grid.filter((g, i) => g === 'house' && linked.has(i)).length,
    solarShaded: light.sun && light.alpha > 0.05 ? grid.filter((g, i) => g === 'solar' && shaded.has(i)).length : 0,
    solarLit: light.sun && light.alpha > 0.05 ? grid.filter((g, i) => g === 'solar' && !shaded.has(i)).length : 0,
    night: !light.sun && light.alpha > 0.1,
  });
  const stats = useMemo(() => JSON.parse(statsKey), [statsKey]);

  // Uusi repliikki pienen tauon jälkeen, kun edellinen on suljettu
  useEffect(() => {
    if (line) return undefined;
    const next = nextLine(stats, seen);
    if (!next) return undefined;
    const id = setTimeout(() => {
      setSeen((s) => new Set(s).add(next.id));
      setLine(next);
      play('speak', { volume: 0.5 });
    }, 900);
    return () => clearTimeout(id);
  }, [line, stats, seen]);

  // Kupla sulkeutuu itsestään luettavan ajan jälkeen
  useEffect(() => {
    if (!line) return undefined;
    const id = setTimeout(() => setLine(null), bubbleTime(line.text));
    return () => clearTimeout(id);
  }, [line]);

  // ── Taivaan valo: aurinko tai kuu kulkee kaaressa vasemmalta oikealle ──
  const sky = {
    '--lx': `${8 + 84 * light.s}cqw`,
    '--ly': `${34 - 24 * Math.sin(Math.PI * light.s)}cqw`,
    '--day': light.sun ? Math.min(1, Math.sin(Math.PI * light.s) * 2) : 0,
  };

  return (
    <div className={`sb-game${paused ? ' is-paused' : ''}`} style={sky}>
      <City className="sb-game-city" />
      <div className="sb-game-day" aria-hidden="true" />
      <div className={`sb-game-light${light.sun ? ' is-sun' : ' is-moon'}`} aria-hidden="true" />

      <div className="sb-game-board">
        <Board
          grid={grid}
          rots={rots}
          previewRot={previewRot}
          tool={tool}
          hover={hover}
          light={light}
          shadows={shadows}
          shaded={shaded}
          onPoint={onPoint}
        />
      </div>

      <div className="sb-hud">
        <p className="sb-hud-chapter">
          <span>Luku 1</span>
          <span className="sb-hud-sep" aria-hidden="true" />
          <span>Kylä</span>
        </p>
        <div className="sb-hud-actions">
          <button
            type="button"
            className={`sb-icon-btn${paused ? ' is-active' : ''}`}
            aria-pressed={paused}
            aria-label="Tauko (välilyönti)"
            title="Tauko (välilyönti)"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPaused((p) => !p)}
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

      {paused && <p className="sb-paused">Tauko</p>}

      <Guide key={line?.id} line={line} onClose={() => setLine(null)} />
      <Toolbar tool={tool} onSelect={select} onRotate={rotate} manual={rotMode !== null} />
    </div>
  );
}