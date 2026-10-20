import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

// Pienille kirjaimille pienet merkit ja isoille isot, jotta satunnaismerkit ovat lähes oikean kirjaimen levyisiä
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖ0123456789#%&*+<>/';
const LOWER = 'abcdefghijklmnopqrstuvwxyzäö0123456789*+<>/';

const randomFrom = (set) => set[Math.floor(Math.random() * set.length)];

// Arvotaan satunnaismerkki jokaiselle vielä paljastamattomalle kirjaimelle (null = näytetään oikea kirjain)
function scramble(text, revealed) {
  return text
    .split('')
    .map((ch, i) =>
      i < revealed || ch === ' ' ? null : randomFrom(ch === ch.toLowerCase() ? LOWER : UPPER),
    );
}

// Teksti "dekoodautuu" satunnaisista merkeistä oikeaksi, kun se tulee näkyviin
export default function ScrambleText({ text, as: Tag = 'span', className, duration = 1400 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduceMotion = useReducedMotion();
  const [glyphs, setGlyphs] = useState([]);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setGlyphs(progress < 1 ? scramble(text, Math.floor(progress * text.length)) : []);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, text, duration]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">
        {text.split('').map((ch, i) =>
          glyphs[i] ? (
            // Oikea kirjain varaa paikan näkymättömänä ja satunnaismerkki piirretään sen päälle,
            // joten otsikon leveys ja rivitys pysyvät samoina koko animaation ajan
            <span key={i} className="scramble-char">
              <span className="scramble-real">{ch}</span>
              <span className="scramble-glyph">{glyphs[i]}</span>
            </span>
          ) : (
            ch
          ),
        )}
      </span>
    </Tag>
  );
}