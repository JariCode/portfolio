import { Component, Suspense, lazy, useCallback, useRef, useState } from 'react';
import { GAMES } from '../data/games.js';
import ScrambleText from './ScrambleText.jsx';
import Modal from './Modal.jsx';
import './Games.css';

// lazy() luodaan kerran moduulin tasolla: renderöinnissä luotuna peli latautuisi ja nollautuisi joka kerta.
// Pelin koodi haetaan vasta, kun peli avataan ensimmäisen kerran.
const GAME_COMPONENTS = Object.fromEntries(
  GAMES.filter((g) => g.load).map((g) => [g.id, lazy(g.load)]),
);

// Pelin kaatuminen tai latausvirhe ei saa viedä koko sivua mukanaan
class GameErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="games-msg">Peliä ei saatu käyntiin. Päivitä sivu ja yritä uudelleen.</p>;
    }
    return this.props.children;
  }
}

export default function Games() {
  const [activeId, setActiveId] = useState(null);
  const screenRef = useRef(null);

  const game = GAMES.find((g) => g.id === activeId);
  const GameView = game ? GAME_COMPONENTS[game.id] : null;

  // Pysyvä funktio: Modal ajaa efektinsä uudelleen aina, kun onClose vaihtuu
  const closeGame = useCallback(() => setActiveId(null), []);

  return (
    <section id="top" className="section games">
      <ScrambleText as="h1" className="section-title games-title" text="Pelialue" />
      <p className="games-intro">
        Kolme pientä peliä, jotka olen koodannut itse. Pelit pyörivät suoraan tällä sivulla
        selaimessasi, eikä niitä tarvitse asentaa.
      </p>

      <ul className="games-list">
        {GAMES.map((g, i) => (
          <li key={g.id} className={`games-card games-accent--${g.color}`}>
            <span className="games-num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <p className="games-genre">{g.genre}</p>
            <h2 className="games-name">{g.name}</h2>
            <p className="games-desc">{g.description}</p>

            <dl className="games-controls">
              <div>
                <dt>Tietokone</dt>
                <dd>{g.controls.desktop}</dd>
              </div>
              <div>
                <dt>Puhelin</dt>
                <dd>{g.controls.mobile}</dd>
              </div>
            </dl>

            <button type="button" className="btn games-btn" onClick={() => setActiveId(g.id)}>
              Pelaa
            </button>
          </li>
        ))}
      </ul>

      {/* Peli kelluu sivun päällä: sivu ei rullaa pelatessa, ja Modal palauttaa
          sulkiessa fokuksen sen pelin Pelaa-nappiin */}
      <Modal
        open={!!game}
        onClose={closeGame}
        label={game?.name ?? ''}
        className={`modal--game games-accent--${game?.color}`}
        initialFocus={screenRef}
        closeOnBackdrop={false}
      >
        {game && (
          <>
            <h2 className="games-modal-name">{game.name}</h2>
            {/* Kuvasuhde tulee pelin tiedoista, jotta pysty- ja vaakapelit mahtuvat näytölle.
                tabIndex: pelinäkymä saa fokuksen, joten näppäimet menevät peliin */}
            <div ref={screenRef} className="games-screen" style={{ '--ratio': game.ratio }} tabIndex={-1}>
              {GameView ? (
                <GameErrorBoundary key={game.id}>
                  <Suspense fallback={<p className="games-msg">Ladataan peliä…</p>}>
                    <GameView />
                  </Suspense>
                </GameErrorBoundary>
              ) : (
                <p className="games-msg">{game.name} on vielä rakenteilla.</p>
              )}
            </div>
          </>
        )}
      </Modal>
    </section>
  );
}