import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import '@fontsource-variable/orbitron';
import Title from './Title.jsx';
import Intro from './Intro.jsx';
import { isMuted, playMusic, setMuted, stopMusic, unlock } from './sound.js';
import './SpaceDriver.css';

// Phaser on iso kirjasto: ladataan vasta, kun pelaaja aloittaa. Aloitusnäkymä ja
// alkuanimaatio aukeavat heti, ja lataus ehtii yleensä valmiiksi animaation aikana.
const Game = lazy(() => import('./Game.jsx'));
const preloadGame = () => import('./Game.jsx');

// Space Driverin vaiheet: aloitusnäkymä → alkuanimaatio → peli.
// Pelikenttä (Phaser ja Tiled-kartta) on Game.jsx:ssä; se tuhoutuu, kun vaihe vaihtuu.
// Orbitron-fontti tuodaan täällä eikä koko sivulle: se ladataan vasta, kun peli avataan.
export default function SpaceDriver() {
  const [phase, setPhase] = useState('title');

  // M mykistää kaikissa vaiheissa. Kun peli suljetaan, musiikki hiljenee.
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'KeyM' && !e.repeat) setMuted(!isMuted());
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      stopMusic(0.2);
    };
  }, []);

  // Pysyvät funktiot: Intro käynnistää ajastimensa uudelleen, jos onDone vaihtuu.
  // Aloita peli -painallus on käyttäjän ele, joten ääni avataan tässä (selaimen vaatimus).
  const start = useCallback(() => {
    unlock();
    playMusic('intro', { loop: false, fadeIn: 0.3 });
    preloadGame();
    setPhase('intro');
  }, []);
  const play = useCallback(() => setPhase('play'), []);
  const toTitle = useCallback(() => {
    stopMusic();
    setPhase('title');
  }, []);

  return (
    <div className="sd">
      {phase === 'title' && <Title onStart={start} />}
      {phase === 'intro' && <Intro onDone={play} />}
      {phase === 'play' && (
        <Suspense fallback={<p className="sd-loading">Ladataan…</p>}>
          <Game onExit={toTitle} />
        </Suspense>
      )}
    </div>
  );
}