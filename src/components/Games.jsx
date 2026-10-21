import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
import { GAMES } from '../data/games.js';
import ScrambleText from './ScrambleText.jsx';
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
  const stageRef = useRef(null);
  const closeRef = useRef(null);
  const listRef = useRef(null);
  const returnFocusTo = useRef(null); // suljetun pelin id, jonka Pelaa-nappiin fokus palaa

  const game = GAMES.find((g) => g.id === activeId);
  const GameView = game ? GAME_COMPONENTS[game.id] : null;

  // Avattu peli vieritetään näkyviin (scroll-padding-top pitää sen navin alapuolella).
  // Fokus siirretään Sulje-nappiin, koska painettu Pelaa-nappi poistuu käytöstä
  // ja fokus putoaisi muuten sivun alkuun. Suljettaessa fokus palaa pelin korttiin.
  useEffect(() => {
    if (activeId) {
      stageRef.current?.scrollIntoView({ block: 'start' });
      closeRef.current?.focus({ preventScroll: true });
    } else if (returnFocusTo.current) {
      listRef.current?.querySelector(`[data-game="${returnFocusTo.current}"]`)?.focus();
      returnFocusTo.current = null;
    }
  }, [activeId]);

  const closeGame = () => {
    returnFocusTo.current = activeId;
    setActiveId(null);
  };

  return (
    <section id="top" className="section games">
      <ScrambleText as="h1" className="section-title games-title" text="Pelialue" />
      <p className="games-intro">
        Kolme pientä peliä, jotka olen koodannut itse. Pelit pyörivät suoraan tällä sivulla
        selaimessasi, eikä niitä tarvitse asentaa.
      </p>

      {game && (
        <div ref={stageRef} className={`games-stage games-accent--${game.color}`}>
          <div className="games-stage-bar">
            <h2 className="games-stage-name">{game.name}</h2>
            <button ref={closeRef} type="button" className="btn games-btn" onClick={closeGame}>
              Sulje peli
            </button>
          </div>

          {/* Kuvasuhde tulee pelin tiedoista, jotta pysty- ja vaakapelit mahtuvat näytölle */}
          <div className="games-screen" style={{ '--ratio': game.ratio }}>
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
        </div>
      )}

      <ul ref={listRef} className="games-list">
        {GAMES.map((g, i) => {
          const isActive = g.id === activeId;
          return (
            <li key={g.id} className={`games-card games-accent--${g.color}${isActive ? ' is-active' : ''}`}>
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

              <button
                type="button"
                className="btn games-btn"
                data-game={g.id}
                onClick={() => setActiveId(g.id)}
                disabled={isActive}
              >
                {isActive ? 'Käynnissä' : 'Pelaa'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}