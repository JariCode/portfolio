import { useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import LevelScene, { GAME_W, GAME_H } from './LevelScene.js';
import './Game.css';

// Aika muodossa 1:23.4
function formatTime(ms) {
  const total = Math.floor(ms / 100);
  const min = Math.floor(total / 600);
  const sec = Math.floor((total % 600) / 10);
  return `${min}:${String(sec).padStart(2, '0')}.${total % 10}`;
}

// Kosketusnapit kirjoittavat samaan olioon, jota scene lukee joka ruudulla
const TOUCH_BUTTONS = [
  { key: 'left', label: 'Vasemmalle', icon: '◀', side: 'left' },
  { key: 'right', label: 'Oikealle', icon: '▶', side: 'left' },
  { key: 'attack', label: 'Lyö', icon: '✦', side: 'right' },
  { key: 'jump', label: 'Hyppää', icon: '▲', side: 'right' },
];

export default function Game({ onExit }) {
  const rootRef = useRef(null);
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const controlsRef = useRef({ left: false, right: false, jump: false, attack: false });
  const replayRef = useRef(null);
  const [hud, setHud] = useState({ time: 0, falls: 0 });
  const [result, setResult] = useState(null);

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
    game.events.on('zr-finish', setResult);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Maaliruudulla fokus Pelaa uudelleen -napissa, jotta Enter aloittaa heti. Pelin aikana
  // fokus on pelinäkymässä: alkuanimaation Ohita-nappi poistui, eikä fokus saa jäädä sivulle.
  useEffect(() => {
    (result ? replayRef : rootRef).current?.focus({ preventScroll: true });
  }, [result]);

  const replay = () => {
    setResult(null);
    setHud({ time: 0, falls: 0 });
    gameRef.current?.scene.getScene('level').scene.restart();
  };

  const press = (key, down) => (e) => {
    e.preventDefault();
    controlsRef.current[key] = down;
  };

  return (
    <div className="zr-game" ref={rootRef} tabIndex={-1}>
      <div className="zr-game-canvas" ref={hostRef} />

      <div className="zr-hud" aria-hidden={!!result}>
        <span className="zr-hud-world">Maailma 1 · Neonkatu</span>
        <span className="zr-hud-time">{formatTime(hud.time)}</span>
      </div>

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
        <div className="zr-result" role="dialog" aria-label="Maali">
          <p className="zr-result-title">Maali!</p>
          <p className="zr-result-stats">
            Aika <strong>{formatTime(result.time)}</strong>
            {result.falls > 0 && (
              <>
                {' '}· putoamisia <strong>{result.falls}</strong>
              </>
            )}
          </p>
          <div className="zr-actions">
            <button type="button" className="zr-btn zr-btn--start" ref={replayRef} onClick={replay}>
              Pelaa uudelleen
            </button>
            <button type="button" className="zr-btn zr-btn--ghost" onClick={onExit}>
              Valikkoon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}