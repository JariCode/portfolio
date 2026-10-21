import { GAMES_LINK } from '../data/nav.js';
import './GamesLink.css';

// Pelialueen painike: pelialue on oma sivunsa eikä etusivun osio, joten se on erotettu
// navin ja footerin osiolinkeistä omaksi napikseen. Sama nappi navissa, footerissa ja herossa.
// variant: 'nav' (navi ja footer) tai 'hero' (isompi, alaotsikolla)
// active: ollaan pelialueella (navi näyttää sen nykyisenä sivuna)
export default function GamesLink({ variant = 'nav', active = false, onClick }) {
  return (
    <a
      href={GAMES_LINK.href}
      className={`games-link games-link--${variant}${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <svg className="games-link-icon" viewBox="0 0 24 24" aria-hidden="true">
        {/* Peliohjain: runko, ristiohjain ja kaksi nappia */}
        <path className="games-link-pad" d="M7 7h10a5 5 0 0 1 4.9 6l-.7 3.4a2.4 2.4 0 0 1-4.2 1L15 15H9l-2 2.4a2.4 2.4 0 0 1-4.2-1L2.1 13A5 5 0 0 1 7 7Z" />
        <path className="games-link-cross" d="M7.5 10v4M5.5 12h4" />
        <circle className="games-link-btn" cx="16" cy="11" r="1.1" />
        <circle className="games-link-btn" cx="18" cy="13.4" r="1.1" />
      </svg>
      {variant === 'hero' ? (
        <span className="games-link-text">
          <span className="games-link-label">Pelaa selainpelejä</span>
          <span className="games-link-sub">{GAMES_LINK.label}</span>
        </span>
      ) : (
        <span className="games-link-label">{GAMES_LINK.label}</span>
      )}
      {variant === 'hero' && <span className="games-link-arrow" aria-hidden="true" />}
    </a>
  );
}