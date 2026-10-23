import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as Phaser from 'phaser';
import LevelScene, { GAME_W, GAME_H, MAX_HP, NEW_RUN } from './LevelScene.js';
import MetroCutscene from './MetroCutscene.jsx';
import ParkCutscene from './ParkCutscene.jsx';
import Outro from './Outro.jsx';
import { WORLDS } from './worlds.js';
import { calcScore, clearSaves, formatTime, readRecord, saveRecord } from './score.js';
import { isMuted, onMuteChange, playMusic, setMuted } from './sound.js';
import './Game.css';

// Kosketusnapit kirjoittavat samaan olioon, jota scene lukee joka ruudulla
const TOUCH_BUTTONS = [
  { key: 'left', label: 'Vasemmalle', icon: '◀', side: 'left' },
  { key: 'right', label: 'Oikealle', icon: '▶', side: 'left' },
  { key: 'attack', label: 'Lyö', icon: '✦', side: 'right' },
  { key: 'jump', label: 'Hyppää', icon: '▲', side: 'right' },
];

const EMPTY_HUD = { time: 0, hp: MAX_HP, orbs: 0, totalOrbs: 0, kills: 0, totalZombies: 0, world: 0, worldName: WORLDS[0].name };
const FIRST_WORLD = { world: 0, carry: NEW_RUN };

// Välianimaatiot maailmojen välillä: worlds.js kertoo, mikä näytetään ennen maailmaa
const CUTSCENES = { metro: MetroCutscene, park: ParkCutscene };

export default function Game({ onExit }) {
  const rootRef = useRef(null);
  const touchRef = useRef(null);
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef({ left: false, right: false, jump: false, attack: false });
  const replayRef = useRef(null);
  // Nykyisen maailman alku: kaatuessa yritetään uudelleen tästä, ei koko pelin alusta
  const worldStartRef = useRef(FIRST_WORLD);
  const [hud, setHud] = useState(EMPTY_HUD);
  // result: { kind: 'finish' | 'dead', ...pelin tiedot, score, newRecord }
  const [result, setResult] = useState(null);
  const [cutscene, setCutscene] = useState(null);
  const [train, setTrain] = useState(false);
  // Lopputekstit ennen maaliruutua; maaliruudun tiedot odottavat refissä
  const [outro, setOutro] = useState(false);
  const pendingRef = useRef(null);
  // Mykistys on sound.js:ssä, jotta M-näppäin (ZRunner.jsx) ja nappi pysyvät samassa tilassa
  const muted = useSyncExternalStore(onMuteChange, isMuted);

  // Phaser luodaan kerran ja tuhotaan, kun pelinäkymä suljetaan (modaali, Esc, valikkoon)
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: GAME_W,
      height: GAME_H,
      backgroundColor: '#05030f',
      banner: false,
      // tileBias: kuinka syvälle laattaan kappale saa yhdellä askeleella upota ja silti
      // törmätä. Oletus 16 on liian pieni korkealta pudottaessa (hahmo menee läpi).
      physics: { default: 'arcade', arcade: { debug: false, tileBias: 40 } },
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      render: { roundPixels: true },
      // Kuvat <img>-elementillä: oletus (XHR + blob:-osoite) vaatisi CSP:hen img-src blob:
      loader: { imageLoadType: 'HTMLImageElement' },
      // Phaserin oma ääni pois: äänet soitetaan sound.js:llä, jota myös animaatiot käyttävät
      audio: { noAudio: true },
      scene: [LevelScene],
      callbacks: {
        preBoot: (g) => g.registry.set('controls', controlsRef.current),
      },
    });

    game.events.on('zr-hud', setHud);
    game.events.on('zr-train', setTrain);
    game.events.on('zr-finish', (stats) => {
      setTrain(false);
      // Välimaali: tiedot siirtyvät seuraavaan maailmaan ja välianimaatio alkaa
      if (!stats.lastWorld) {
        const next = stats.world + 1;
        const { hp, time, orbs, totalOrbs, kills, totalZombies } = stats;
        worldStartRef.current = { world: next, carry: { hp, time, orbs, totalOrbs, kills, totalZombies } };
        setCutscene({ number: next + 1, name: WORLDS[next].name, kind: WORLDS[next].cutscene });
        playMusic('intro', { loop: false, fadeIn: 0.3 });
        return;
      }
      // Koko pelin maali: pisteet ja ennätys (tallennetaan vain, jos parempi kuin aiempi)
      const score = calcScore({ ...stats, worlds: WORLDS.length });
      const newRecord = saveRecord({
        score: score.total,
        time: formatTime(stats.time),
        items: stats.orbs,
        kills: stats.kills,
      });
      pendingRef.current = { kind: 'finish', ...stats, score, newRecord, best: readRecord() };
      setOutro(true);
    });
    // Kaatuessa ei tallenneta mitään
    game.events.on('zr-dead', (stats) => {
      setTrain(false);
      setResult({ kind: 'dead', ...stats });
    });
    gameRef.current = game;
    playMusic('music');

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // iPhone avaa pitkällä painalluksella suurennuslasin tai valintavalikon, vaikka teksti ei ole
  // valittavissa. Sen estää vain kosketuksen alun preventDefault, ja Reactin onTouchStart on
  // passiivinen (preventDefault ei tehoa), joten kuuntelija lisätään suoraan elementtiin.
  // Napit toimivat pointer-tapahtumilla, joihin tämä ei vaikuta.
  useEffect(() => {
    const el = touchRef.current;
    if (!el) return undefined;
    const block = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchstart', block, { passive: false });
    return () => el.removeEventListener('touchstart', block);
  }, []);

  // Loppuruudulla fokus Pelaa uudelleen -napissa, jotta Enter aloittaa heti. Pelin aikana
  // fokus on pelinäkymässä: animaation Ohita-nappi poistui, eikä fokus saa jäädä sivulle.
  useEffect(() => {
    if (cutscene || outro) return;
    (result ? replayRef : rootRef).current?.focus({ preventScroll: true });
  }, [result, cutscene, outro]);

  // Käynnistää maailman: { world, carry }. Sama scene käynnistyy uudelleen uusilla tiedoilla.
  // Pysyvä funktio (vain refejä ja tilan asettajia), jotta välianimaation ajastin ei nollaudu.
  const startWorld = useCallback((start) => {
    setResult(null);
    setOutro(false);
    setTrain(false);
    setHud({ ...EMPTY_HUD, ...start.carry, world: start.world, worldName: WORLDS[start.world].name });
    gameRef.current?.scene.getScene('level').scene.restart(start);
  }, []);

  // Uusi peli alusta maaliruudulta
  const newGame = () => {
    worldStartRef.current = FIRST_WORLD;
    startWorld(FIRST_WORLD);
  };

  // Kaatuessa: sama maailma uudelleen niillä tiedoilla, joilla siihen tultiin, mutta täydellä
  // energialla – muuten vähällä energialla maailmaan tullut jäisi jumiin
  const retry = () => {
    const start = worldStartRef.current;
    startWorld({ ...start, carry: { ...start.carry, hp: MAX_HP } });
  };

  // Välianimaation jälkeen seuraava maailma. Pysyvä funktio: animaation ajastin ei käynnisty uudelleen.
  const endCutscene = useCallback(() => {
    setCutscene(null);
    playMusic('music');
    startWorld(worldStartRef.current);
  }, [startWorld]);

  // Lopputekstien jälkeen maaliruutu pisteineen. Pysyvä funktio: Outro ei käynnisty uudelleen.
  const endOutro = useCallback(() => {
    setOutro(false);
    setResult(pendingRef.current);
  }, []);

  // Poistaa vain Z-Runnerin tallennukset ja palaa alkuvalikkoon
  const clear = () => {
    clearSaves();
    onExit();
  };

  const Cutscene = cutscene ? CUTSCENES[cutscene.kind] ?? MetroCutscene : null;

  const press = (key, down) => (e) => {
    e.preventDefault();
    controlsRef.current[key] = down;
  };

  return (
    <div className="zr-game" ref={rootRef} tabIndex={-1}>
      <div className="zr-game-canvas" ref={hostRef} />

      <div className="zr-hud" aria-hidden={!!result}>
        <div className="zr-hud-left">
          <div className="zr-energy" role="meter" aria-label="Energia" aria-valuemin={0} aria-valuemax={MAX_HP} aria-valuenow={hud.hp}>
            {Array.from({ length: MAX_HP }, (_, i) => (
              <span key={i} className={`zr-energy-cell${i < hud.hp ? ' is-full' : ''}`} />
            ))}
          </div>
          <span className="zr-hud-stat zr-hud-stat--orbs">
            <span className="zr-orb-icon" aria-hidden="true" />
            {hud.orbs}/{hud.totalOrbs}
          </span>
          <span className="zr-hud-stat zr-hud-stat--kills">
            <span className="zr-skull-icon" aria-hidden="true">✕</span>
            {hud.kills}/{hud.totalZombies}
          </span>
        </div>
        <span className="zr-hud-world">
          {hud.world + 1} · {hud.worldName}
        </span>
        <div className="zr-hud-right">
          <span className="zr-hud-time">{formatTime(hud.time)}</span>
          {/* Hiiren painallus ei vie fokusta napille: muuten välilyönti (hyppy) painaisi nappia */}
          <button
            type="button"
            className={`zr-mute${muted ? ' is-muted' : ''}`}
            aria-pressed={muted}
            aria-label="Mykistä äänet (M)"
            title="Mykistä äänet (M)"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMuted(!muted)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path className="zr-mute-speaker" d="M4 9h4l5-4v14l-5-4H4z" />
              {muted ? (
                <path className="zr-mute-wave" d="M16 9l6 6M22 9l-6 6" />
              ) : (
                <path className="zr-mute-wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {train && !result && (
        <p className="zr-train-warning" role="alert">
          Juna tulee!
        </p>
      )}

      <div className="zr-touch" ref={touchRef} aria-hidden="true">
        {['left', 'right'].map((side) => (
          <div key={side} className={`zr-touch-group zr-touch-group--${side}`}>
            {TOUCH_BUTTONS.filter((b) => b.side === side).map((b) => (
              <button
                key={b.key}
                type="button"
                tabIndex={-1}
                className={`zr-touch-btn zr-touch-btn--${b.key}`}
                aria-label={b.label}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  press(b.key, true)(e);
                }}
                onPointerUp={press(b.key, false)}
                onPointerCancel={press(b.key, false)}
                onLostPointerCapture={press(b.key, false)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {b.icon}
              </button>
            ))}
          </div>
        ))}
      </div>

      {Cutscene && <Cutscene number={cutscene.number} worldName={cutscene.name} onDone={endCutscene} />}

      {outro && <Outro onDone={endOutro} />}

      {result && (
        <div className={`zr-result zr-result--${result.kind}`} role="dialog" aria-label={result.kind === 'finish' ? 'Maali' : 'Kaaduit'}>
          <p className="zr-result-title">{result.kind === 'finish' ? 'Maali!' : 'Kaaduit!'}</p>

          <dl className="zr-result-stats">
            <div>
              <dt>Valopallot</dt>
              <dd>
                {result.orbs}/{result.totalOrbs}
              </dd>
            </div>
            <div>
              <dt>Zombit</dt>
              <dd>
                {result.kills}/{result.totalZombies}
              </dd>
            </div>
            <div>
              <dt>Aika</dt>
              <dd>{formatTime(result.time)}</dd>
            </div>
          </dl>

          {result.kind === 'finish' ? (
            <p className="zr-result-score">
              <strong>{result.score.total} p</strong>
              <span>
                {result.score.orbPoints} + {result.score.killPoints} + aikabonus {result.score.timeBonus}
              </span>
              {result.newRecord ? (
                <em className="zr-result-record">Uusi ennätys!</em>
              ) : (
                result.best && <span>Ennätys {result.best.score} p</span>
              )}
            </p>
          ) : (
            <p className="zr-result-score">
              <span>
                Energia loppui maailmassa {result.world + 1} · {result.worldName}. Pisteet lasketaan vain maaliin päästessä.
              </span>
            </p>
          )}

          <div className="zr-actions">
            <button
              type="button"
              className="zr-btn zr-btn--start"
              ref={replayRef}
              onClick={result.kind === 'finish' ? newGame : retry}
            >
              {result.kind === 'finish' ? 'Pelaa uudelleen' : 'Yritä uudelleen'}
            </button>
            <button type="button" className="zr-btn zr-btn--ghost" onClick={onExit}>
              Valikkoon
            </button>
          </div>
          <button type="button" className="zr-clear" onClick={clear}>
            Tyhjennä tallennukset
          </button>
        </div>
      )}
    </div>
  );
}