import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import * as Phaser from 'phaser';
import SpaceScene, { GAME_W, GAME_H, MAX_BOMBS, MAX_HP, MAX_WEAPON, NEW_RUN } from './SpaceScene.js';
import { SECTORS } from './sectors.js';
import { Frame } from './Hud.jsx';
import { clearSaves, readRecord, saveRecord } from './score.js';
import { isMuted, onMuteChange, playMusic, setMuted } from './sound.js';
import './Game.css';

const EMPTY_HUD = { hp: MAX_HP, score: 0, progress: 0, bombs: NEW_RUN.bombs, weapon: NEW_RUN.weapon, sector: 0, name: SECTORS[0].name, boss: null };
const FIRST_SECTOR = { sector: 0, carry: NEW_RUN };
// Ohjevihje näkyy pelin alussa näin kauan (ms)
const HINT_MS = 5000;

// Pisteet mittarinäytön tapaan aina kuusinumeroisina
const digits = (n) => String(n).padStart(6, '0');

export default function Game({ onExit }) {
  const rootRef = useRef(null);
  const hostRef = useRef(null);
  const touchRef = useRef(null);
  const gameRef = useRef(null);
  const actionRef = useRef(null);
  // Kosketusnapit kirjoittavat tähän olioon, jota scene lukee joka ruudulla.
  // fire: ampumanappi pohjassa, bomb: pommin painallusten laskuri (scene käyttää uudet).
  const controlsRef = useRef({ fire: false, bomb: 0 });
  const [hud, setHud] = useState(EMPTY_HUD);
  // result: { kind: 'clear' | 'dead', sector, score, kills, newRecord, best }
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState(true);
  // Mykistys on sound.js:ssä, jotta M-näppäin (SpaceDriver.jsx) ja nappi pysyvät samassa tilassa
  const muted = useSyncExternalStore(onMuteChange, isMuted);

  // Phaser luodaan kerran ja tuhotaan, kun pelinäkymä suljetaan (modaali, Esc, valikkoon)
  useEffect(() => {
    // Ennätys tallennetaan pelin päättyessä vain, jos se parani
    const finish = (kind) => (stats) => {
      const newRecord = saveRecord({ score: stats.score, sector: stats.sector + 1, kills: stats.kills });
      setResult({ kind, ...stats, newRecord, best: readRecord() });
    };
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
      callbacks: {
        preBoot: (g) => g.registry.set('controls', controlsRef.current),
      },
    });

    game.events.on('sd-hud', setHud);
    game.events.on('sd-clear', finish('clear'));
    game.events.on('sd-dead', finish('dead'));
    gameRef.current = game;
    playMusic('music');

    return () => {
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // iPhone avaa pitkällä painalluksella suurennuslasin tai valintavalikon. Sen estää vain
  // kosketuksen alun preventDefault, ja Reactin onTouchStart on passiivinen, joten kuuntelija
  // lisätään suoraan pelialueeseen ja kosketusnappien alueeseen. Kosketusnapit toimivat
  // pointer-tapahtumilla, joihin tämä ei vaikuta; HUDin mykistysnappi on näiden ulkopuolella.
  useEffect(() => {
    const els = [hostRef.current, touchRef.current].filter(Boolean);
    const block = (e) => {
      if (e.cancelable) e.preventDefault();
    };
    els.forEach((el) => el.addEventListener('touchstart', block, { passive: false }));
    return () => els.forEach((el) => el.removeEventListener('touchstart', block));
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

  // Uusi peli alusta. Pysyvä funktio, jotta se ei vaihdu joka renderöinnillä.
  const restart = useCallback(() => {
    setResult(null);
    setHud(EMPTY_HUD);
    controlsRef.current.fire = false;
    gameRef.current?.scene.getScene('space').scene.restart(FIRST_SECTOR);
  }, []);

  // Poistaa vain Space Driverin tallennukset ja palaa alkuvalikkoon
  const clear = () => {
    clearSaves();
    onExit();
  };

  // Ampumanappi: pohjassa niin kauan kuin sormi on napilla (pointer capture pitää sen,
  // vaikka sormi liukuisi napin reunan yli)
  const fireDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    controlsRef.current.fire = true;
  };

  const fireUp = (e) => {
    e.preventDefault();
    controlsRef.current.fire = false;
  };

  const bomb = (e) => {
    e.preventDefault();
    controlsRef.current.bomb += 1;
  };

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
          <div className="sd-hud-gear">
            <span className="sd-hud-bombs" aria-label={`Pommit ${hud.bombs}/${MAX_BOMBS}`}>
              {Array.from({ length: MAX_BOMBS }, (_, i) => (
                <span key={i} className={`sd-bomb-dot${i < hud.bombs ? ' is-full' : ''}`} />
              ))}
            </span>
            <span className="sd-hud-weapon" aria-label={`Aseen taso ${hud.weapon}/${MAX_WEAPON}`}>
              Ase {hud.weapon}
            </span>
          </div>
        </div>

        <div className="sd-hud-sector">
          <span className="sd-hud-label">Sektori {hud.sector + 1}</span>
          <span className="sd-hud-name">{hud.name}</span>
        </div>

        <div className="sd-hud-right">
          <span className="sd-hud-score">{digits(hud.score)}</span>
          {/* Hiiren painallus ei vie fokusta napille, ettei välilyönti (ampuminen) paina nappia */}
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

        {/* Sektorin eteneminen; pomon aikana tilalla pomon energia */}
        {hud.boss ? (
          <div className="sd-boss" role="meter" aria-label={hud.boss.name} aria-valuemin={0} aria-valuemax={hud.boss.max} aria-valuenow={hud.boss.hp}>
            <span className="sd-boss-name">{hud.boss.name}</span>
            <span className="sd-boss-bar" style={{ '--sd-boss': hud.boss.hp / hud.boss.max }} />
          </div>
        ) : (
          <div className="sd-progress" style={{ '--sd-progress': hud.progress / 100 }} />
        )}
      </div>

      {/* Kosketusnäytöllä ampuminen ja pommi napeista; alusta ohjataan vetämällä muualta */}
      <div className="sd-touch" ref={touchRef} aria-hidden="true">
        <button
          type="button"
          tabIndex={-1}
          className="sd-touch-btn sd-touch-btn--bomb"
          aria-label="Pommi"
          disabled={hud.bombs === 0}
          onPointerDown={bomb}
          onContextMenu={(e) => e.preventDefault()}
        >
          Pommi
          <small>{hud.bombs}</small>
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="sd-touch-btn sd-touch-btn--fire"
          aria-label="Ammu"
          onPointerDown={fireDown}
          onPointerUp={fireUp}
          onPointerCancel={fireUp}
          onLostPointerCapture={fireUp}
          onContextMenu={(e) => e.preventDefault()}
        >
          Ammu
        </button>
      </div>

      {hint && !result && (
        <p className="sd-hint" aria-hidden="true">
          <span className="sd-hint-keys">Nuolet liikkuvat · välilyönti ampuu · B pommi</span>
          <span className="sd-hint-touch">Vedä alusta sormella · ammu napista</span>
        </p>
      )}

      {result && (
        <div className="sd-result" role="dialog" aria-label={result.kind === 'clear' ? 'Sektori läpäisty' : 'Alus tuhoutui'}>
          <Frame />
          <div className={`sd-result-panel sd-result-panel--${result.kind}`}>
            <p className="sd-result-tag">Sektori {result.sector + 1}</p>
            <p className="sd-result-title">{result.kind === 'clear' ? 'Läpäisty' : 'Alus tuhoutui'}</p>

            <dl className="sd-result-stats">
              <div>
                <dt>Pisteet</dt>
                <dd>{digits(result.score)}</dd>
              </div>
              <div>
                <dt>Tuhottu</dt>
                <dd>{result.kills}</dd>
              </div>
            </dl>

            {result.newRecord ? (
              <p className="sd-result-record">Uusi ennätys</p>
            ) : (
              result.best && <p className="sd-result-text">Ennätys {digits(result.best.score)}</p>
            )}
            <p className="sd-result-text sd-result-note">
              {result.kind === 'clear'
                ? 'Raskas risteilijä kaatui ja kivivyö on selvitetty. Seuraavat sektorit ovat vielä rakenteilla.'
                : 'Runko ei kestänyt. Väistä kiviä ja ammuksia, ja kerää energiaa matkalta.'}
            </p>

            <div className="sd-result-actions">
              <button ref={actionRef} type="button" className="sd-btn sd-btn--start" onClick={restart}>
                Lennä uudelleen
              </button>
              <button type="button" className="sd-btn sd-btn--ghost" onClick={onExit}>
                Valikkoon
              </button>
            </div>
            <button type="button" className="sd-clear" onClick={clear}>
              Tyhjennä tallennukset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}