import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import '@fontsource-variable/cinzel';
import Title from './Title.jsx';
import Intro from './Intro.jsx';
import MuteButton from './MuteButton.jsx';
import { isMuted, playMusic, setMuted, stopMusic, unlock } from './sound.js';
import { clearCity } from './score.js';
import './ShadowBuilder.css';

// Pelikenttä ladataan vasta, kun pelaaja aloittaa; lataus ehtii yleensä alkuanimaation aikana
const Game = lazy(() => import('./Game.jsx'));
const preloadGame = () => import('./Game.jsx');

// Shadow Builderin vaiheet: aloitusnäkymä → alkuanimaatio → peli. Tallennettu kaupunki
// jatkuu suoraan peliin ilman alkuanimaatiota.
// Cinzel-fontti tuodaan täällä eikä koko sivulle: se ladataan vasta, kun peli avataan.
export default function ShadowBuilder() {
  const [phase, setPhase] = useState('title');
  // Kaupunki, josta peli jatkuu (score.js), tai null uudessa pelissä
  const [saved, setSaved] = useState(null);

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
  // Uusi peli aloittaa tyhjästä: keskeneräinen kaupunki poistetaan, ennätys jää
  const start = useCallback(() => {
    clearCity();
    setSaved(null);
    unlock();
    playMusic('intro', { loop: false, fadeIn: 0.6 });
    preloadGame();
    setPhase('intro');
  }, []);
  const resume = useCallback((city) => {
    unlock();
    playMusic('music');
    setSaved(city);
    setPhase('play');
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
      {phase === 'title' && <Title onStart={start} onResume={resume} />}
      {phase === 'intro' && <Intro onDone={play} />}
      {/* Äänet saa pois jo ennen alkuanimaation musiikkia; pelissä nappi on HUDissa */}
      {phase !== 'play' && <MuteButton className="sb-mute--float" />}
      {phase === 'play' && (
        <Suspense fallback={<p className="sb-loading">Kaupunki herää…</p>}>
          <Game onExit={toTitle} saved={saved} />
        </Suspense>
      )}
    </div>
  );
}