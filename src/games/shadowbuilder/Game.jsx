import { useEffect, useRef } from 'react';
import City from './City.jsx';
import Guardian from './Guardian.jsx';
import MuteButton from './MuteButton.jsx';
import './Game.css';

// Pelikenttä. Vaiheessa 0 vain paikka, josta peli jatkuu alkuanimaation jälkeen: ruudukko,
// rakentaminen ja varjot tulevat vaiheessa 1 (claude/shadowbuilder.md).
export default function Game({ onExit }) {
  const backRef = useRef(null);

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="sb-game">
      <City className="sb-game-city" />
      <div className="sb-game-guide">
        <Guardian variant="bust" mood="iloinen" />
        <p className="sb-game-bubble">Tähän nousee kaupunki. Rakentaminen alkaa seuraavassa vaiheessa.</p>
      </div>
      <div className="sb-game-hud">
        <MuteButton />
      </div>
      <button ref={backRef} type="button" className="sb-btn sb-game-back" onClick={onExit}>
        Valikkoon
      </button>
    </div>
  );
}