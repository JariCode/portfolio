import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import City from './City.jsx';
import Board from './Board.jsx';
import Toolbar from './Toolbar.jsx';
import Guide from './Guide.jsx';
import Hud from './Hud.jsx';
import ChapterScene from './ChapterScene.jsx';
import { autoRot, CHAPTERS, connectedSet, isHome, placeError, rotatable, SIZE, toolById, TOOLS, unlocked } from './buildings.js';
import { castShadows, DAY, lightAt } from './shadows.js';
import { build, CAP, endDay, growthOf, newCity, population, power, sunShares } from './economy.js';
import { nextLine } from './story.js';
import { play } from './sound.js';
import { clearCity, saveCity, saveRecord } from './score.js';
import './Game.css';

// Valon kulku päivitetään noin 20 kertaa sekunnissa: varjot liikkuvat hitaasti, joten
// tiheämpi päivitys ei näkyisi, mutta piirtäisi turhaan.
const TICK = 50;
// Peli alkaa aamupäivästä, jolloin varjot osuvat selvästi maahan
const START = 0.12;
// Pelinopeudet: 1×, 2× ja 3× (päivä 40 s, 20 s tai noin 13 s)
const SPEEDS = [1, 2, 3];

// Kuinka kauan vartijan puhekupla pysyy: perusaika ja lisäaika merkkiä kohden
const bubbleTime = (text) => 3800 + text.length * 55;

// Kaupungin tila (economy.js): rakentaminen ja päivän laskenta puhtaina funktioina
function reducer(city, action) {
  if (action.type === 'build') return build(city, action.x, action.y, action.tool, action.rot);
  if (action.type === 'endDay') return endDay(city);
  return city;
}

// saved: tallennettu kaupunki (score.js), josta peli jatkuu, tai null uudessa pelissä
export default function Game({ onExit, saved }) {
  const [city, dispatch] = useReducer(reducer, saved, (s) => (s ? { ...newCity(), ...s, report: null } : newCity()));
  const { grid, rots, res, money, chapter } = city;
  const [tool, setTool] = useState('road');
  // Seuraavan rakennuksen kääntö: null = automaattinen, 0–3 = käännetty R:llä tai napilla
  const [rotMode, setRotMode] = useState(null);
  const [hover, setHover] = useState(null);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [t, setT] = useState(saved?.t ?? START);
  const [line, setLine] = useState(null);
  const [seen, setSeen] = useState(() => new Set(saved?.seen ?? []));
  // Luvun välianimaatio ja voittoruutu näytetään kerran, kun ne saavutetaan
  const [scene, setScene] = useState(null);
  const [victory, setVictory] = useState(false);
  const clock = useRef((saved?.t ?? START) * DAY);
  const shownChapter = useRef(city.chapter);
  const shownDone = useRef(city.done);

  // ── Aika: valo kulkee ja päivä vaihtuu, paitsi tauolla ──
  useEffect(() => {
    if (paused) return undefined;
    let last = performance.now();
    let sent = 0;
    let frame = requestAnimationFrame(function step(now) {
      // Välilehden ollessa taustalla kertynyt aika ei hyppää valoa eteenpäin
      const before = Math.floor(clock.current / DAY);
      clock.current += (Math.min(now - last, 100) / 1000) * speed;
      last = now;
      // Keskiyö: päivän laskenta (verot, tuotot, asukkaiden muutto)
      if (Math.floor(clock.current / DAY) > before) dispatch({ type: 'endDay' });
      if (now - sent >= TICK) {
        sent = now;
        setT((clock.current / DAY) % 1);
      }
      frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [paused, speed]);

  const light = useMemo(() => lightAt(t), [t]);
  const { shadows, shaded } = useMemo(() => castShadows(grid, light), [grid, light]);

  // Sähkö lasketaan päivän keskimääräisestä valosta, joten se muuttuu vain rakentaessa
  const linked = useMemo(() => connectedSet(grid), [grid]);
  const energy = useMemo(() => power(grid, linked, sunShares(grid)), [grid, linked]);
  const pop = population(res);
  const dark = energy.use > energy.prod;

  // ── Päivän raportti: rahan kilinä ja sähkökatkon ääni ──
  useEffect(() => {
    if (!city.report) return;
    play(city.report.blackout ? 'blackout' : 'coin', { volume: 0.5 });
  }, [city.report]);

  // ── Luku vaihtui tai tavoite saavutettiin: välianimaatio, ennätys ja voittoruutu ──
  useEffect(() => {
    if (city.chapter > shownChapter.current) {
      shownChapter.current = city.chapter;
      setScene(CHAPTERS[city.chapter - 1]);
      play('chapter');
    }
    if (city.done && !shownDone.current) {
      shownDone.current = true;
      setVictory({ days: city.report?.day ?? city.day, record: saveRecord({ days: city.report?.day ?? city.day }) });
      setPaused(true);
    }
  }, [city.chapter, city.done, city.report, city.day]);

  // Välianimaatio poistuu itsestään (ChapterScene.css kestää saman ajan)
  useEffect(() => {
    if (!scene) return undefined;
    const id = setTimeout(() => setScene(null), 3600);
    return () => clearTimeout(id);
  }, [scene]);

  // ── Rakentaminen ──
  const place = useCallback(
    (x, y) => {
      if (placeError(grid, x, y, tool, chapter, money)) return;
      dispatch({ type: 'build', x, y, tool, rot: rotatable(tool) ? rotMode : null });
      play(tool === 'demolish' ? 'demolish' : 'build', { rate: tool === 'road' || tool === 'grass' ? 1.4 : 1 });
    },
    [grid, tool, chapter, money, rotMode],
  );

  // Esikatselun kääntö: pelaajan valinta tai automaattisesti kohti tietä
  const previewRot = hover && rotatable(tool) ? (rotMode ?? autoRot(grid, hover.x, hover.y)) : 0;

  // R tai kääntönappi: käännetään esikatselua 90° siitä, mihin se nyt osoittaa
  const rotate = useCallback(() => {
    if (!rotatable(tool)) return;
    setRotMode((r) => ((r ?? (hover ? autoRot(grid, hover.x, hover.y) : 0)) + 1) % 4);
  }, [tool, hover, grid]);

  // ── Tallennus: jokaisen rakennuksen, purun ja päivän jälkeen (sekä uuden repliikin jälkeen) ──
  // Pelkkä raatihuone ei ole tallennettava kaupunki, joten tyhjä kaupunki poistetaan.
  useEffect(() => {
    if (city.grid.some((g) => g && g !== 'hall')) {
      const { grid: g, rots: r, res: p, money: m, day, chapter: c, done } = city;
      saveCity({ grid: g, rots: r, res: p, money: m, day, chapter: c, done, seen: [...seen], t: (clock.current / DAY) % 1 });
    } else {
      clearCity();
    }
  }, [city, seen]);

  // Hiiri: liike esikatselee, painallus rakentaa, tietä ja nurmea voi vetää painike pohjassa.
  // Kosketus: ensimmäinen napautus esikatselee, toinen samaan ruutuun rakentaa.
  const onPoint = (tile, kind) => {
    if (kind === 'move') {
      setHover(tile);
    } else if (kind === 'drag') {
      setHover(tile);
      if (tile && (tool === 'road' || tool === 'grass')) place(tile.x, tile.y);
    } else if (kind === 'click') {
      if (tile) place(tile.x, tile.y);
    } else if (tile) {
      if (hover && hover.x === tile.x && hover.y === tile.y) place(tile.x, tile.y);
      else setHover(tile);
    } else {
      setHover(null);
    }
  };

  // Työkalun vaihto palauttaa käännön automaattiseksi. Lukittua ei voi valita.
  const select = useCallback(
    (id) => {
      if (!toolById(id) || !unlocked(id, chapter)) return;
      setTool(id);
      setRotMode(null);
    },
    [chapter],
  );

  const nextSpeed = useCallback(() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length]), []);

  // ── Näppäimet: numerot valitsevat, R kääntää, Delete purkaa, välilyönti tauko, F nopeus.
  // Esc sulkee pelin (Games.jsx). ──
  useEffect(() => {
    const onKey = (e) => {
      const byKey = TOOLS.find((x) => x.key === e.key);
      if (byKey) select(byKey.id);
      else if (e.key === 'Backspace') select('demolish');
      else if (e.code === 'KeyR' && !e.repeat) rotate();
      else if (e.code === 'KeyF' && !e.repeat) nextSpeed();
      else if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) setPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select, rotate, nextSpeed]);

  // ── Valikon tietorivi: asukkaat kodin kohdalla, muuten miksi ruutuun ei voi rakentaa ──
  let hint = null;
  if (hover) {
    const i = hover.y * SIZE + hover.x;
    const here = grid[i];
    if (isHome(here) && tool !== 'tower' && tool !== 'demolish') {
      const growth = linked.has(i) ? `+${growthOf(grid, i)}/pv` : 'ei tietä';
      hint = { title: toolById(here).name, text: `${res[i]}/${CAP[here]} asukasta · ${growth}` };
    } else {
      const error = placeError(grid, hover.x, hover.y, tool, chapter, money);
      if (error) hint = { error };
      else if (isHome(tool)) {
        // Esikatselu kertoo, paljonko talo kasvaisi juuri tässä ruudussa
        const next = [...grid];
        next[i] = tool;
        const def = toolById(tool);
        const road = connectedSet(next).has(i) ? '' : ' · tarvitsee tien';
        hint = { title: `${def.name} ${def.price} €`, text: `kasvaa tässä +${growthOf(next, i)} asukasta/yö${road}` };
      }
    }
  }

  // ── Tilanne vartijan repliikkejä varten ──
  // Tiivistetään merkkijonoksi, jotta valon tasainen liike ei käynnistä repliikkien
  // tarkistusta uudelleen: muutos tulee vain, kun jokin luku oikeasti muuttuu.
  const count = (type) => grid.filter((g) => g === type).length;
  const statsKey = JSON.stringify({
    road: count('road'),
    grass: count('grass'),
    house: count('house'),
    tower: count('tower'),
    shop: count('shop'),
    solar: count('solar'),
    park: count('park'),
    mushroom: count('mushroom'),
    plant: count('power'),
    buildings: grid.filter((g) => g && !['road', 'hall', 'grass'].includes(g)).length,
    unlinked: grid.filter((g, i) => g && !['road', 'hall', 'grass'].includes(g) && !linked.has(i)).length,
    linkedHouse: grid.filter((g, i) => isHome(g) && linked.has(i)).length,
    solarShaded: light.sun && light.alpha > 0.05 ? grid.filter((g, i) => g === 'solar' && shaded.has(i)).length : 0,
    solarLit: light.sun && light.alpha > 0.05 ? grid.filter((g, i) => g === 'solar' && !shaded.has(i)).length : 0,
    night: !light.sun && light.alpha > 0.1,
    day: city.day,
    poor: money < 20,
    dark,
    chapter,
    done: city.done,
    tool,
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
          chapter={chapter}
          money={money}
          dark={dark}
          onPoint={onPoint}
        />
      </div>

      <Hud
        chapter={chapter}
        pop={pop}
        money={money}
        energy={energy}
        day={city.day}
        t={t}
        report={city.report}
        paused={paused}
        speed={speed}
        onPause={() => setPaused((p) => !p)}
        onSpeed={nextSpeed}
        onExit={onExit}
      />

      {paused && !victory && <p className="sb-paused">Tauko</p>}

      {scene && <ChapterScene chapter={scene} />}

      <Guide key={line?.id} line={line} onClose={() => setLine(null)} />
      <Toolbar
        tool={tool}
        chapter={chapter}
        money={money}
        hint={hint}
        onSelect={select}
        onRotate={rotate}
        manual={rotMode !== null}
      />

      {victory && (
        <div className="sb-victory" role="dialog" aria-label="Kaupunki heräsi">
          <h4>Kaupunki heräsi</h4>
          <p>
            Tuhat asukasta <strong>{victory.days}. päivänä</strong>
            {victory.record && <span className="sb-victory-record">Uusi ennätys</span>}
          </p>
          <div className="sb-victory-actions">
            <button
              type="button"
              className="sb-btn sb-btn--start"
              onClick={() => {
                setVictory(false);
                setPaused(false);
              }}
            >
              Jatka rakentamista
            </button>
            <button type="button" className="sb-btn" onClick={onExit}>
              Valikkoon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}