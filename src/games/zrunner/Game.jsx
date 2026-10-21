import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import LevelScene, { GAME_W, GAME_H, MAX_HP } from './LevelScene.js';
import { calcScore, clearSaves, formatTime, readRecord, saveRecord } from './score.js';
import './Game.css';

// Kosketusnapit kirjoittavat samaan olioon, jota scene lukee joka ruudulla
const TOUCH_BUTTONS = [
  { key: 'left', label: 'Vasemmalle', icon: '◀', side: 'left' },
  { key: 'right', label: 'Oikealle', icon: '▶', side: 'left' },
  { key: 'attack', label: 'Lyö', icon: '✦', side: 'right' },
  { key: 'jump', label: 'Hyppää', icon: '▲', side: 'right' },
];

const EMPTY_HUD = { time: 0, hp: MAX_HP, orbs: 0, totalOrbs: 0, kills: 0, totalZombies: 0 };

export default function Game({ onExit }) {
  const rootRef = useRef(null);
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef({ left: false, right: false, jump: false, attack: false });
  const replayRef = useRef(null);
  const [hud, setHud] = useState(EMPTY_HUD);
  // result: { kind: 'finish' | 'dead', ...pelin tiedot, score, newRecord }
  const [result, setResult] = useState(null);
  const [cleared, setCleared] = useState(false);

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
      // Ei Phaserin omaa ääntä vielä; Web Audio lisätään myöhemmin
      audio: { noAudio: true },
      scene: [LevelScene],
      callbacks: {
        preBoot: (g) => g.registry.set('controls', controlsRef.current),
      },
    });

    game.events.on('zr-hud', setHud);
    // Maalissa lasketaan pisteet ja tallennetaan ennätys (vain jos parempi kuin aiempi)
    game.events.on('zr-finish', (stats) => {
      const score = calcScore(stats);
      const newRecord = saveRecord({
        score: score.total,
        time: formatTime(stats.time),
        items: stats.orbs,
        kills: stats.kills,
      });
      setResult({ kind: 'finish', ...stats, score, newRecord, best: readRecord() });
    });
    // Kaatuessa ei tallenneta mitään
    game.events.on('zr-dead', (stats) => setResult({ kind: 'dead', ...stats }));
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Loppuruudulla fokus Pelaa uudelleen -napissa, jotta Enter aloittaa heti. Pelin aikana
  // fokus on pelinäkymässä: alkuanimaation Ohita-nappi poistui, eikä fokus saa jäädä sivulle.
  useEffect(() => {
    (result ? replayRef : rootRef).current?.focus({ preventScroll: true });
  }, [result]);

  const replay = () => {
    setResult(null);
    setCleared(false);
    setHud(EMPTY_HUD);
    gameRef.current?.scene.getScene('level').scene.restart();
  };

  // Tietosuojaselosteen lupaus: poistaa vain Z-Runnerin tallennukset ja peli alkaa alusta
  const clear = () => {
    clearSaves();
    replay();
    setCleared(true);
  };

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
        <span className="zr-hud-time">{formatTime(hud.time)}</span>
      </div>

      {cleared && !result && <p className="zr-toast" role="status">Tallennukset tyhjennetty</p>}

      <div className="zr-touch" aria-hidden="true">
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
              <span>Energia loppui. Pisteet lasketaan vain maaliin päästessä.</span>
            </p>
          )}

          <div className="zr-actions">
            <button type="button" className="zr-btn zr-btn--start" ref={replayRef} onClick={replay}>
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