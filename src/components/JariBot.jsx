import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import JariBotAvatar from './JariBotAvatar.jsx';
import './JariBot.css';

// Keskusteluikkuna ladataan vasta ensimmäisellä avauksella, jottei sivun lataus hidastu.
// Hover ja fokus aloittavat latauksen etukäteen, jolloin ikkuna aukeaa viiveettä.
const loadChat = () => import('./JariBotChat.jsx');
const JariBotChat = lazy(loadChat);

// Kelluva Jari-Bot oikeassa alakulmassa. page: 'pelit' pelialueella, muuten etusivu
// (vaikuttaa vain siihen, minne osiolinkit vievät).
export default function JariBot({ page }) {
  const [open, setOpen] = useState(false);
  const [talking, setTalking] = useState(false);
  const buttonRef = useRef(null);

  const close = useCallback(() => {
    setOpen(false);
    setTalking(false);
    buttonRef.current?.focus();
  }, []);

  const toggle = () => (open ? close() : setOpen(true));

  return (
    <div className={`jaribot ${open ? 'is-open' : ''}`}>
      {open && (
        <Suspense fallback={null}>
          <JariBotChat page={page} onClose={close} onTalkingChange={setTalking} />
        </Suspense>
      )}

      <button
        ref={buttonRef}
        type="button"
        className="jaribot-button"
        onClick={toggle}
        onPointerEnter={loadChat}
        onFocus={loadChat}
        aria-expanded={open}
        aria-controls="jaribot-chat"
        aria-label={open ? 'Sulje Jari-Bot' : 'Avaa Jari-Bot: kysy Jarista'}
      >
        <span className="jaribot-bubble" aria-hidden="true">
          Kysy minulta!
        </span>
        <span className="jaribot-figure">
          <JariBotAvatar talking={talking} />
        </span>
      </button>
    </div>
  );
}
