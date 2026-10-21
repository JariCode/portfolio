import { lazy, Suspense, useCallback, useState } from 'react';
import Title from './Title.jsx';
import Intro from './Intro.jsx';
import './ZRunner.css';

// Phaser on iso kirjasto: ladataan vasta, kun pelaaja aloittaa. Aloitusnäkymä ja
// alkuanimaatio aukeavat heti, ja lataus ehtii yleensä valmiiksi animaation aikana.
const Game = lazy(() => import('./Game.jsx'));
const preloadGame = () => import('./Game.jsx');

// Z-Runnerin vaiheet: aloitusnäkymä → alkuanimaatio → peli.
// Pelikenttä (Phaser ja Tiled-kartta) on Game.jsx:ssä; se tuhoutuu, kun vaihe vaihtuu.
export default function ZRunner() {
  const [phase, setPhase] = useState('title');

  // Pysyvät funktiot: Intro käynnistää ajastimensa uudelleen, jos onDone vaihtuu
  const start = useCallback(() => {
    preloadGame();
    setPhase('intro');
  }, []);
  const play = useCallback(() => setPhase('play'), []);
  const toTitle = useCallback(() => setPhase('title'), []);

  return (
    <div className="zr">
      {phase === 'title' && <Title onStart={start} />}
      {phase === 'intro' && <Intro onDone={play} />}
      {phase === 'play' && (
        <Suspense fallback={<p className="zr-loading">Ladataan…</p>}>
          <Game onExit={toTitle} />
        </Suspense>
      )}
    </div>
  );
}