import { useSyncExternalStore } from 'react';
import { isMuted, onMuteChange, setMuted } from './sound.js';
import './MuteButton.css';

// Mykistysnappi. Sama nappi on HUDissa ja kelluvana (sb-mute--float) aloitusnäkymässä ja
// animaatioissa, jotta äänet saa pois jo ennen kuin ensimmäinen musiikki alkaa.
// Mykistys on sound.js:ssä, joten M-näppäin ja kaikki napit pysyvät samassa tilassa.
export default function MuteButton({ className = '' }) {
  const muted = useSyncExternalStore(onMuteChange, isMuted);

  // Hiiren painallus ei vie fokusta napille: muuten välilyönti (pelissä tauko,
  // animaatioissa Ohita) painaisi tätä nappia. Näppäimistöllä mykistetään M:llä.
  return (
    <button
      type="button"
      className={`sb-mute${muted ? ' is-muted' : ''} ${className}`.trim()}
      aria-pressed={muted}
      aria-label="Mykistä äänet (M)"
      title="Mykistä äänet (M)"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => setMuted(!muted)}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="sb-mute-speaker" d="M4 9h4l5-4v14l-5-4H4z" />
        {muted ? (
          <path className="sb-mute-wave" d="M16 9l6 6M22 9l-6 6" />
        ) : (
          <path className="sb-mute-wave" d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" />
        )}
      </svg>
    </button>
  );
}