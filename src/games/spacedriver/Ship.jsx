import { SPRITE_BASE, sprite } from './sprites.js';
import './Ship.css';

// Alus React-näkymiin (aloitusnäkymä, alkuanimaatio, välianimaatiot). Void-paketin alukset
// ovat kerroksina: moottorin liekki, moottori ja runko piirretään päällekkäin samaan ruutuun.
// Pelikentällä samat kuvat piirtää Phaser; tämä on vain animaatioita varten.

// Yksi kerros: vaakasuora sprite-arkki, josta näytetään ruutu kerrallaan (Ship.css)
function Layer({ spriteKey, duration = 0.5 }) {
  const s = sprite(spriteKey);
  return (
    <span
      className={`sd-layer${s.frames > 1 ? ' sd-layer--anim' : ''}`}
      style={{ '--sd-frames': s.frames, '--sd-dur': `${duration}s` }}
    >
      <img src={SPRITE_BASE + s.file} alt="" draggable="false" style={{ width: `${s.frames * 100}%` }} />
    </span>
  );
}

// player: pelaajan alus (nokka ylös), power: moottori täysillä (isompi liekki)
// faction + type: vihollinen (käännetään nokka alas), esim. faction="laivasto1" type="fighter"
export default function Ship({ faction, type, power = false, className = '' }) {
  if (faction) {
    const base = `${faction}-${type}`;
    return (
      <span className={`sd-ship sd-ship--enemy ${className}`} aria-hidden="true">
        <Layer spriteKey={`${base}-moottori`} duration={0.8} />
        <Layer spriteKey={base} />
      </span>
    );
  }
  return (
    <span className={`sd-ship ${className}`} aria-hidden="true">
      <Layer spriteKey={power ? 'pelaaja-liekki-teho' : 'pelaaja-liekki'} duration={power ? 0.35 : 0.3} />
      <Layer spriteKey="pelaaja-moottori" />
      <Layer spriteKey="pelaaja-ehja" />
    </span>
  );
}