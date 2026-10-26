import { useCallback, useEffect, useRef, useState } from 'react';
import * as Phaser from 'phaser';
import SpaceScene, { GAME_W, GAME_H, MAX_BOMBS, MAX_HP, MAX_WEAPON, NEW_RUN } from './SpaceScene.js';
import { WEAPON_NAMES } from './player.js';
import { SECTORS } from './sectors.js';
import { Frame } from './Hud.jsx';
import HyperJump from './HyperJump.jsx';
import Outro from './Outro.jsx';
import { clearSaves, readRecord, saveRecord } from './score.js';
import { playMusic } from './sound.js';
import MuteButton from './MuteButton.jsx';
import './Game.css';

const EMPTY_HUD = { hp: MAX_HP, score: 0, progress: 0, bombs: NEW_RUN.bombs, weapon: NEW_RUN.weapon, sector: 0, name: SECTORS[0].name, boss: null };
const FIRST_SECTOR = { sector: 0, carry: NEW_RUN };
// Ohjevihje näkyy pelin alussa näin kauan (ms)
const HINT_MS = 5000;

// Pisteet mittarinäytön tapaan aina kuusinumeroisina
const digits = (n) => String(n).padStart(6, '0');

// Pelin loppu (tuho tai viimeinen sektori läpi): ennätys tallennetaan vain, jos se parani
function endResult(kind, stats) {
  const newRecord = saveRecord({ score: stats.score, sector: stats.sector + 1, kills: stats.kills });
  return { kind, ...stats, newRecord, best: readRecord() };
}

export default function Game({ onExit }) {
  const rootRef = useRef(null);
  const hostRef = useRef(null);
  const touchRef = useRef(null);
  const gameRef = useRef(null);
  const actionRef = useRef(null);
  // Kosketusnapit kirjoittavat tähän olioon, jota scene lukee joka ruudulla.
  // fire: ampumanappi pohjassa, bomb: pommin painallusten laskuri (scene käyttää uudet),
  // hold: seuraava sektori odottaa hyperhypyn takana.
  const controlsRef = useRef({ fire: false, bomb: 0, hold: false });
  const [hud, setHud] = useState(EMPTY_HUD);
  // result: { kind: 'clear' | 'dead', sector, score, kills, newRecord, best }
  const [result, setResult] = useState(null);
  // Hyperhyppy sektorien välissä: { from, to: { index, name } }
  const [jump, setJump] = useState(null);
  // Lopputekstit viimeisen sektorin jälkeen; loppuruudun tiedot odottavat refissä
  const [outro, setOutro] = useState(false);
  const finalRef = useRef(null);
  // Nykyisen sektorin alku: kaatuessa yritetään uudelleen tästä, ei koko pelin alusta
  const sectorStartRef = useRef(FIRST_SECTOR);
  const [hint, setHint] = useState(true);

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
      callbacks: {
        preBoot: (g) => g.registry.set('controls', controlsRef.current),
      },
    });

    game.events.on('sd-hud', setHud);
    // Sektori läpi: seuraavaan sektoriin hyperhypyllä, viimeisen jälkeen lopputekstit ja
    // loppuruutu. Runko, pisteet, pommit, ase ja tuhotut siirtyvät mukana.
    game.events.on('sd-clear', (stats) => {
      const next = stats.sector + 1;
      if (!SECTORS[next]) {
        finalRef.current = stats;
        setOutro(true);
        // Sama musiikki kuin alkuanimaatiossa
        playMusic('intro', { loop: false, fadeIn: 0.6 });
        return;
      }
      const { hp, score, bombs, weapon, kills } = stats;
      const start = { sector: next, carry: { hp, score, bombs, weapon, kills } };
      sectorStartRef.current = start;
      setJump({ from: stats.sector, to: { index: next, name: SECTORS[next].name } });
      playMusic('intro', { loop: false, fadeIn: 0.3 });
      // Seuraava sektori latautuu jo välianimaation aikana (uuden laivaston kuvat), jottei
      // sen jälkeen tule mustaa hetkeä. Sektori odottaa paikallaan, kunnes hyppy päättyy.
      controlsRef.current.hold = true;
      controlsRef.current.fire = false;
      setHud({ ...EMPTY_HUD, ...start.carry, sector: next, name: SECTORS[next].name });
      game.scene.getScene('space').scene.restart(start);
    });
    game.events.on('sd-dead', (stats) => setResult(endResult('dead', stats)));
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
  // pelinäkymässä, ettei se jää sivulle (myös hyperhypyn Ohita-napin poistuttua).
  // Hyperhypyn ja lopputekstien aikana fokus on niiden Ohita-napissa.
  useEffect(() => {
    if (jump || outro) return;
    (result ? actionRef : rootRef).current?.focus({ preventScroll: true });
  }, [result, jump, outro]);

  // Hyppy päättyi (tai ohitettiin): valmiiksi ladattu sektori lähtee liikkeelle ja
  // taistelumusiikki alkaa. Pysyvä funktio, jotta hyperhypyn ajastin ei nollaudu.
  const endJump = useCallback(() => {
    controlsRef.current.hold = false;
    setJump(null);
    playMusic('music');
  }, []);

  // Lopputekstien jälkeen (tai ohitettaessa) loppuruutu pisteineen. Pysyvä funktio, jotta
  // lopputekstien efekti ei käynnisty uudelleen.
  const endOutro = useCallback(() => {
    setOutro(false);
    setResult(endResult('clear', finalRef.current));
  }, []);

  // Kaatuessa sama sektori uudelleen niillä tiedoilla, joilla siihen tultiin, mutta ehjällä
  // rungolla (muuten vähällä rungolla sektoriin tullut ei pääsisi eteenpäin). Viimeisen
  // sektorin läpäisyn jälkeen uusi peli alusta. Sama scene käynnistyy uusilla tiedoilla.
  const restart = () => {
    if (result?.kind === 'clear') sectorStartRef.current = FIRST_SECTOR;
    const start = { ...sectorStartRef.current, carry: { ...sectorStartRef.current.carry, hp: MAX_HP } };
    setResult(null);
    setHud({ ...EMPTY_HUD, ...start.carry, sector: start.sector, name: SECTORS[start.sector].name });
    controlsRef.current.fire = false;
    playMusic('music');
    gameRef.current?.scene.getScene('space').scene.restart(start);
  };

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
          {/* Pommit ja ase omilla riveillään rungon alla */}
          <div className="sd-hud-gear">
            <span className="sd-hud-label">Pommit</span>
            <span className="sd-hud-bombs" aria-label={`Pommit ${hud.bombs}/${MAX_BOMBS}`}>
              {Array.from({ length: MAX_BOMBS }, (_, i) => (
                <span key={i} className={`sd-bomb-dot${i < hud.bombs ? ' is-full' : ''}`} />
              ))}
            </span>
            <span className="sd-hud-label">Ase</span>
            <span className="sd-hud-weapon" aria-label={`Ase ${WEAPON_NAMES[hud.weapon]}, taso ${hud.weapon}/${MAX_WEAPON}`}>
              {WEAPON_NAMES[hud.weapon]}
              <span className="sd-weapon-pips" aria-hidden="true">
                {Array.from({ length: MAX_WEAPON }, (_, i) => (
                  <span key={i} className={i < hud.weapon ? 'is-full' : ''} />
                ))}
              </span>
            </span>
          </div>
        </div>

        <div className="sd-hud-sector">
          <span className="sd-hud-label">Sektori {hud.sector + 1}</span>
          <span className="sd-hud-name">{hud.name}</span>
        </div>

        <div className="sd-hud-right">
          <span className="sd-hud-score">{digits(hud.score)}</span>
          <MuteButton />
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

      {jump && <HyperJump from={jump.from} to={jump.to} onDone={endJump} />}
      {outro && <Outro onDone={endOutro} />}
      {/* Animaatiot peittävät HUDin, joten niiden ajaksi mykistysnappi kelluu päällä */}
      {(jump || outro) && <MuteButton className="sd-mute--float" />}

      {hint && !result && (
        <p className="sd-hint" aria-hidden="true">
          <span className="sd-hint-keys">Nuolet liikuttavat · välilyönti ampuu · B pommi</span>
          <span className="sd-hint-touch">Vedä alusta sormella · ammu napista</span>
        </p>
      )}

      {result && (
        <div className="sd-result" role="dialog" aria-label={result.kind === 'clear' ? 'Peli läpäisty' : 'Alus tuhoutui'}>
          <Frame />
          <div className={`sd-result-panel sd-result-panel--${result.kind}`}>
            <p className="sd-result-tag">{result.kind === 'clear' ? `Sektorit 1–${SECTORS.length}` : `Sektori ${result.sector + 1}`}</p>
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
                ? 'Kaikki kolme vihollislaivastoa on lyöty ja raja on taas turvassa. Hyvä lento!'
                : 'Runko ei kestänyt. Väistä esteitä ja ammuksia, ja kerää energiaa matkalta.'}
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