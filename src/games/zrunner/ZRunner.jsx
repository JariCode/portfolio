import { useCallback, useState } from 'react';
import Title from './Title.jsx';
import Intro from './Intro.jsx';
import './ZRunner.css';

// Z-Runnerin vaiheet: aloitusnäkymä → alkuanimaatio → peli.
// Varsinainen pelikenttä (Phaser ja Tiled-kartat) tulee "play"-vaiheeseen.
export default function ZRunner() {
  const [phase, setPhase] = useState('title');

  // Pysyvät funktiot: Intro käynnistää ajastimensa uudelleen, jos onDone vaihtuu
  const start = useCallback(() => setPhase('intro'), []);
  const play = useCallback(() => setPhase('play'), []);
  const toTitle = useCallback(() => setPhase('title'), []);

  return (
    <div className="zr">
      {phase === 'title' && <Title onStart={start} />}
      {phase === 'intro' && <Intro onDone={play} />}
      {phase === 'play' && (
        <div className="zr-soon">
          <p className="zr-soon-world">Maailma 1 · Neonkatu</p>
          <p className="zr-soon-text">Kenttä on vielä rakenteilla.</p>
          <button type="button" className="zr-btn zr-btn--ghost" onClick={toTitle}>
            Takaisin valikkoon
          </button>
        </div>
      )}
    </div>
  );
}