import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Title from './Title.jsx';
import Intro from './Intro.jsx';
import MuteButton from './MuteButton.jsx';
import { isMuted, playMusic, setMuted, stopMusic, unlock } from './sound.js';
import './ZRunner.css';

// Phaser on iso kirjasto: ladataan vasta, kun pelaaja aloittaa. Aloitusnäkymä ja
// alkuanimaatio aukeavat heti, ja lataus ehtii yleensä valmiiksi animaation aikana.
const Game = lazy(() => import('./Game.jsx'));
const preloadGame = () => import('./Game.jsx');

// Z-Runnerin vaiheet: aloitusnäkymä → alkuanimaatio → peli.
// Pelikenttä (Phaser ja Tiled-kartta) on Game.jsx:ssä; se tuhoutuu, kun vaihe vaihtuu.
export default function ZRunner() {
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
    <div className="zr">
      {phase === 'title' && <Title onStart={start} />}
      {phase === 'intro' && <Intro onDone={play} />}
      {/* Äänet saa pois jo ennen alkuanimaation musiikkia; pelissä nappi on HUDissa */}
      {phase !== 'play' && <MuteButton className="zr-mute--float" />}
      {phase === 'play' && (
        <Suspense fallback={<p className="zr-loading">Ladataan…</p>}>
          <Game onExit={toTitle} />
        </Suspense>
      )}
    </div>
  );
}