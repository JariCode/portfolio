import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as Phaser from 'phaser';
import SpaceScene, { GAME_W, GAME_H, MAX_HP, NEW_RUN } from './SpaceScene.js';
import { SECTORS } from './sectors.js';
import { Frame } from './Hud.jsx';
import { isMuted, onMuteChange, playMusic, setMuted } from './sound.js';
import './Game.css';

const EMPTY_HUD = { hp: MAX_HP, score: 0, progress: 0, sector: 0, name: SECTORS[0].name };
const FIRST_SECTOR = { sector: 0, carry: NEW_RUN };
// Ohjevihje näkyy pelin alussa näin kauan (ms)
const HINT_MS = 4000;

// Pisteet mittarinäytön tapaan aina kuusinumeroisina
const digits = (n) => String(n).padStart(6, '0');

export default function Game({ onExit }) {
  const rootRef = useRef(null);
  const hostRef = useRef(null);
  const gameRef = useRef(null);
  const actionRef = useRef(null);
  const [hud, setHud] = useState(EMPTY_HUD);
  // result: { kind: 'clear' | 'dead', sector, score }
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(true);
  // Mykistys on sound.js:ssä, jotta M-näppäin (SpaceDriver.jsx) ja nappi pysyvät samassa tilassa
  const muted = useSyncExternalStore(onMuteChange, isMuted);

  // Phaser luodaan kerran ja tuhotaan, kun pelinäkymä suljetaan (modaali, Esc, valikkoon)
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: GAME_W,
      height: GAME_H,
      backgroundColor: '#04030c',
      banner: false,
      // Pikseligrafiikka terävänä: ei pehmennystä suurennettaessa
      pixelArt: true,
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
      // Kuvat <img>-elementillä: oletus (XHR + blob:-osoite) vaatisi CSP:hen img-src blob:
      loader: { imageLoadType: 'HTMLImageElement' },
      // Phaserin oma ääni pois: äänet soitetaan sound.js:llä, jota myös animaatiot käyttävät
      audio: { noAudio: true },
      scene: [SpaceScene],
    });

    game.events.on('sd-hud', setHud);
    game.events.on('sd-clear', (stats) => setResult({ kind: 'clear', ...stats }));
    game.events.on('sd-dead', (stats) => setResult({ kind: 'dead', ...stats }));
    gameRef.current = game;
    playMusic('music');

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // iPhone avaa pitkällä painalluksella suurennuslasin tai valintavalikon. Sen estää vain
  // kosketuksen alun preventDefault, ja Reactin onTouchStart on passiivinen, joten kuuntelija
  // lisätään suoraan pelialueeseen (canvas). HUDin napit ovat sen ulkopuolella, joten niiden
  // klikkaukset toimivat.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return undefined;
    const block = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    el.addEventListener('touchstart', block, { passive: false });
    return () => el.removeEventListener('touchstart', block);
  }, []);

  // Vihje piiloon hetken kuluttua
  useEffect(() => {
    const t = setTimeout(() => setHint(false), HINT_MS);
    return () => clearTimeout(t);
  }, []);

  // Loppuruudulla fokus pääpainikkeessa, jotta Enter jatkaa heti. Pelin aikana fokus on
  // pelinäkymässä, ettei se jää sivulle.
  useEffect(() => {
    (result ? actionRef : rootRef).current?.focus({ preventScroll: true });
  }, [result]);

  // Sama sektori uudelleen alusta. Pysyvä funktio, jotta se ei vaihdu joka renderöinnillä.
  const restart = useCallback(() => {
    setResult(null);
    setHud(EMPTY_HUD);
    gameRef.current?.scene.getScene('space').scene.restart(FIRST_SECTOR);
  }, []);

  return (
    <div className="sd-game" ref={rootRef} tabIndex={-1}>
      <div className="sd-game-canvas" ref={hostRef} />

      <div className="sd-hud" aria-hidden={!!result}>
        <div className="sd-hud-hull">
          <span className="sd-hud-label">Runko</span>
          <div className="sd-hull" role="meter" aria-label="Rungon kestävyys" aria-valuemin={0} aria-valuemax={MAX_HP} aria-valuenow={hud.hp}>
            {Array.from({ length: MAX_HP }, (_, i) => (
              <span key={i} className={`sd-hull-cell${i < hud.hp ? ' is-full' : ''}${hud.hp <= 2 ? ' is-low' : ''}`} />
            ))}
          </div>
        </div>

        <div className="sd-hud-sector">
          <span className="sd-hud-label">Sektori {hud.sector + 1}</span>
          <span className="sd-hud-name">{hud.name}</span>
        </div>

        <div className="sd-hud-right">
          <span className="sd-hud-score">{digits(hud.score)}</span>
          {/* Hiiren painallus ei vie fokusta napille, ettei näppäimistö jää nappiin */}
          <button
            type="button"
            className={`sd-mute${muted ? ' is-muted' : ''}`}
            aria-pressed={muted}
            aria-label="Mykistä äänet (M)"
            title="Mykistä äänet (M)"
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setMuted(!muted)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path className="sd-mute-speaker" d="M4 9h4l5-4v14l-5-4H4z" />
              {muted ? (
                <path className="sd-mute-wave" d="M16 9l6 6M22 9l-6 6" />
              ) : (
                <path className="sd-mute-wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
              )}
            </svg>
          </button>
        </div>

        {/* Sektorin eteneminen: palkki täyttyy, kun kartta rullaa kohti loppua */}
        <div className="sd-progress" style={{ '--sd-progress': hud.progress / 100 }} />
      </div>

      {hint && !result && (
        <p className="sd-hint" aria-hidden="true">
          <span className="sd-hint-keys">Nuolet tai WASD · alus ampuu itse</span>
          <span className="sd-hint-touch">Vedä alusta sormella · alus ampuu itse</span>
        </p>
      )}

      {result && (
        <div className="sd-result" role="dialog" aria-label={result.kind === 'clear' ? 'Sektori läpäisty' : 'Alus tuhoutui'}>
          <Frame />
          <div className={`sd-result-panel sd-result-panel--${result.kind}`}>
            <p className="sd-result-tag">Sektori {result.sector + 1}</p>
            <p className="sd-result-title">{result.kind === 'clear' ? 'Läpäisty' : 'Alus tuhoutui'}</p>
            <p className="sd-result-text">
              {result.kind === 'clear'
                ? 'Kivivyö selvitetty. Viholliset ja tehostimet tulevat seuraavassa vaiheessa.'
                : 'Runko ei kestänyt. Väistä kiviä: jokainen osuma vie yhden rungon palkin.'}
            </p>
            <div className="sd-result-actions">
              <button ref={actionRef} type="button" className="sd-btn sd-btn--start" onClick={restart}>
                Lennä uudelleen
              </button>
              <button type="button" className="sd-btn sd-btn--ghost" onClick={onExit}>
                Valikkoon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}