import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { profile } from '../data/profile.js';
import './CodeWindow.css';

// Osaaminen kahden kappaleen riveinä, jotta rivit eivät veny liian pitkiksi
const stackLines = [];
for (let i = 0; i < profile.heroStack.length; i += 2) {
  const pair = profile.heroStack.slice(i, i + 2);
  stackLines.push([
    ['pad', '    '],
    ...pair.flatMap((item) => [['str', `'${item}'`], ['pun', ', ']]),
  ]);
}

// Koodi riveittäin. Jokainen rivi on lista [tyyppi, teksti] -paloja,
// tyyppi määrää värin (CSS-luokka tok-tyyppi).
const LINES = [
  [['key', 'const '], ['var', 'jari'], ['pun', ' = {']],
  [['pad', '  '], ['prop', 'nimi'], ['pun', ': '], ['str', `'${profile.name}'`], ['pun', ',']],
  [['pad', '  '], ['prop', 'rooli'], ['pun', ': '], ['str', `'${profile.role}'`], ['pun', ',']],
  [['pad', '  '], ['prop', 'sijainti'], ['pun', ': '], ['str', `'${profile.location}'`], ['pun', ',']],
  [['pad', '  '], ['prop', 'osaaminen'], ['pun', ': [']],
  ...stackLines,
  [['pad', '  '], ['pun', '],']],
  [['pad', '  '], ['prop', 'tyonhaku'], ['pun', ': '], ['bool', 'true'], ['pun', ',']],
  [['pun', '};']],
  [],
  [['var', 'jari'], ['pun', '.'], ['fn', 'rakenna'], ['pun', '('], ['str', "'sinun ideasi'"], ['pun', ');']],
];

const TOTAL = LINES.reduce((sum, line) => sum + line.reduce((s, [, t]) => s + t.length, 0) + 1, 0);
const CHARS_PER_SECOND = 38;

// Palauttaa rivit niin, että niistä näkyy vain `typed` ensimmäistä merkkiä,
// sekä rivin, jolla kursori on
function visibleCode(typed) {
  let left = typed;
  let cursorLine = 0;
  const rendered = [];

  LINES.forEach((line, li) => {
    if (left > 0) cursorLine = li;
    const parts = [];
    line.forEach(([type, text], pi) => {
      const shown = text.slice(0, Math.max(0, left));
      left -= text.length;
      if (shown) {
        parts.push(
          <span key={pi} className={`tok-${type}`}>
            {shown}
          </span>,
        );
      }
    });
    left -= 1; // rivinvaihto
    rendered.push(parts);
  });

  return { rendered, cursorLine };
}

// Koodi-ikkuna, joka "kirjoittaa" sisältönsä merkki kerrallaan
export default function CodeWindow({ delay = 0 }) {
  const reduceMotion = useReducedMotion();
  const [typed, setTyped] = useState(reduceMotion ? TOTAL : 0);

  useEffect(() => {
    if (reduceMotion) return;
    let frame;
    let start;
    const timer = setTimeout(() => {
      const tick = (now) => {
        start ??= now;
        const count = Math.min(TOTAL, Math.floor(((now - start) / 1000) * CHARS_PER_SECOND));
        setTyped(count);
        if (count < TOTAL) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [delay, reduceMotion]);

  const { rendered, cursorLine } = visibleCode(typed);

  return (
    <motion.figure
      className="code-window"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: Math.max(0, delay - 0.4) }}
      aria-label={`${profile.name}, ${profile.role}, ${profile.location}`}
    >
      <div className="code-bar" aria-hidden="true">
        <span className="code-dot" />
        <span className="code-dot" />
        <span className="code-dot" />
        <span className="code-file">jari.js</span>
      </div>

      <pre className="code-body" aria-hidden="true">
        {rendered.map((parts, li) => (
          <div key={li} className="code-line">
            <span className="code-num">{li + 1}</span>
            <code>
              {parts}
              {li === cursorLine && <span className="code-cursor" />}
            </code>
          </div>
        ))}
      </pre>
    </motion.figure>
  );
}