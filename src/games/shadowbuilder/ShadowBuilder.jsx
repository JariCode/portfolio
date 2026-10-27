import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import '@fontsource-variable/cinzel';
import Title from './Title.jsx';
import Intro from './Intro.jsx';
import MuteButton from './MuteButton.jsx';
import { isMuted, playMusic, setMuted, stopMusic, unlock } from './sound.js';
import './ShadowBuilder.css';

// Pelikenttä ladataan vasta, kun pelaaja aloittaa; lataus ehtii yleensä alkuanimaation aikana
const Game = lazy(() => import('./Game.jsx'));
const preloadGame = () => import('./Game.jsx');

// Shadow Builderin vaiheet: aloitusnäkymä → alkuanimaatio → peli.
// Cinzel-fontti tuodaan täällä eikä koko sivulle: se ladataan vasta, kun peli avataan.
export default function ShadowBuilder() {
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
    playMusic('intro', { loop: false, fadeIn: 0.6 });
    preloadGame();
    setPhase('intro');
  }, []);
  const play = useCallback(() => {
    playMusic('music');
    setPhase('play');
  }, []);
  const toTitle = useCallback(() => {
    stopMusic();
    setPhase('title');
  }, []);

  return (
    <div className="sb">
      {phase === 'title' && <Title onStart={start} />}
      {phase === 'intro' && <Intro onDone={play} />}
      {/* Äänet saa pois jo ennen alkuanimaation musiikkia; pelissä nappi on HUDissa */}
      {phase !== 'play' && <MuteButton className="sb-mute--float" />}
      {phase === 'play' && (
        <Suspense fallback={<p className="sb-loading">Kaupunki herää…</p>}>
          <Game onExit={toTitle} />
        </Suspense>
      )}
    </div>
  );
}