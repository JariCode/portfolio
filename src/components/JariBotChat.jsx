import { useEffect, useRef, useState } from 'react';
import { CHIP_LABELS, GREETING, MAX_INPUT, START_CHIPS, cleanInput, reply, safeHref } from '../data/jaribot.js';
import { linkHref } from '../data/nav.js';
import './JariBotChat.css';

// Kirjoitusnopeus: merkkiä per askel ja askelen väli. Pitkä vastaus kirjoittuu enintään
// noin 1,8 sekunnissa, jottei kävijä joudu odottamaan.
const STEP_MS = 24;
const MAX_TYPE_MS = 1800;
// Muistissa pidetään vain viimeisimmät viestit (mitään ei tallenneta pysyvästi)
const MAX_MESSAGES = 40;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let nextId = 1;
const botMessage = (answer) => ({ id: nextId++, from: 'bot', ...answer });

// Keskusteluikkuna. Kaikki teksti näytetään Reactin tekstisolmuina: kävijän syöte ei
// koskaan päädy sivulle HTML:nä eikä sitä suoriteta.
export default function JariBotChat({ page, onClose, onTalkingChange }) {
  const [messages, setMessages] = useState(() => [botMessage({ text: GREETING, chips: START_CHIPS })]);
  const [input, setInput] = useState('');
  // Kirjoitettavana olevan bot-viestin id ja kuinka monta merkkiä siitä näkyy.
  // "Vähennä liikettä": viesti näkyy heti kokonaan.
  const [typing, setTyping] = useState(() => ({
    id: messages[0].id,
    shown: reduceMotion() ? messages[0].text.length : 0,
  }));
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const home = page !== 'pelit';

  const typingMsg = messages.find((m) => m.id === typing?.id);
  const isTyping = Boolean(typingMsg && typing.shown < typingMsg.text.length);

  // Kirjoitusanimaatio: merkkejä lisää askel kerrallaan
  useEffect(() => {
    if (!isTyping) return undefined;
    const total = typingMsg.text.length;
    const perStep = Math.max(1, Math.ceil(total / (MAX_TYPE_MS / STEP_MS)));
    const timer = setInterval(() => {
      setTyping((t) => (t ? { ...t, shown: Math.min(total, t.shown + perStep) } : t));
    }, STEP_MS);
    return () => clearInterval(timer);
  }, [isTyping, typingMsg]);

  // Hahmon suu liikkuu niin kauan kuin teksti kirjoittuu
  useEffect(() => {
    onTalkingChange(isTyping);
  }, [isTyping, onTalkingChange]);
  useEffect(() => () => onTalkingChange(false), [onTalkingChange]);

  // Uusin viesti näkyviin
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, typing]);

  // Työpöydällä kirjoituskenttä saa fokuksen; puhelimella ei, jottei näppäimistö
  // ponnahda esiin ja peitä vastausta
  const focusInput = () => {
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus({ preventScroll: true });
  };
  useEffect(focusInput, []);

  // Esc sulkee ikkunan, vaikka fokus olisi jo poistuneen aihenapin mukana kadonnut.
  // Jos sivulla on modaali auki, Esc kuuluu sille.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const ask = (text, topicId) => {
    const question = cleanInput(text);
    if (!question) return;
    const answer = botMessage(reply(question, topicId));
    setMessages((list) => [...list, { id: nextId++, from: 'user', text: question }, answer].slice(-MAX_MESSAGES));
    setTyping({ id: answer.id, shown: reduceMotion() ? answer.text.length : 0 });
    // Painettu aihenappi katoaa, joten fokus siirretään kenttään eikä se putoa sivun alkuun
    focusInput();
  };

  const onSubmit = (e) => {
    e.preventDefault();
    ask(input);
    setInput('');
  };

  // Linkin osoite: osio tällä tai etusivulla, pelialue tai ulkoinen https-osoite
  const hrefOf = (link) => {
    if (link.section) return safeHref(linkHref({ id: link.section }, home));
    if (link.page === 'pelit') return home ? '/pelit/' : null;
    return safeHref(link.href);
  };

  return (
    <div id="jaribot-chat" className="jaribot-chat" role="dialog" aria-label="Jari-Bot">
      <header className="jaribot-chat-head">
        <p className="jaribot-chat-title">
          Jari-Bot <span>· portfolion opas</span>
        </p>
        <button type="button" className="jaribot-chat-close" onClick={onClose} aria-label="Sulje Jari-Bot">
          <span aria-hidden="true" />
        </button>
      </header>

      <ol ref={listRef} className="jaribot-chat-list" aria-live="polite">
        {messages.map((m) => {
          const current = m.id === typing?.id;
          const shownText = current ? m.text.slice(0, typing.shown) : m.text;
          const done = !current || !isTyping;
          const links = done ? (m.links ?? []).map((l) => ({ ...l, url: hrefOf(l) })).filter((l) => l.url) : [];
          // Aihenapit vain viimeisimmässä bot-viestissä
          const last = m.id === messages.at(-1).id;
          return (
            <li key={m.id} className={`jaribot-msg jaribot-msg--${m.from}`}>
              <p className="jaribot-msg-text">
                {shownText}
                {!done && <span className="jaribot-caret" aria-hidden="true" />}
              </p>

              {links.length > 0 && (
                <div className="jaribot-links">
                  {links.map((l) => (
                    <a
                      key={l.label}
                      className="jaribot-link"
                      href={l.url}
                      {...(l.external
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : { onClick: onClose })}
                    >
                      {l.label}
                      {l.external && <span className="sr-only"> (avautuu uuteen välilehteen)</span>}
                    </a>
                  ))}
                </div>
              )}

              {done && last && m.chips?.length > 0 && (
                <div className="jaribot-chips">
                  {m.chips.map((id) => (
                    <button key={id} type="button" className="jaribot-chip" onClick={() => ask(CHIP_LABELS[id], id)}>
                      {CHIP_LABELS[id]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <form className="jaribot-form" onSubmit={onSubmit}>
        <label htmlFor="jaribot-input" className="sr-only">
          Kysy Jarista
        </label>
        <input
          ref={inputRef}
          id="jaribot-input"
          className="jaribot-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
          maxLength={MAX_INPUT}
          placeholder="Kysy esim. mitä Jari osaa"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
        />
        <button type="submit" className="jaribot-send" disabled={!input.trim()} aria-label="Lähetä">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 12h13M12 5l7 7-7 7" />
          </svg>
        </button>
      </form>
    </div>
  );
}
