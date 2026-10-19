import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖ0123456789#%&*+<>/';

function scramble(text, revealed) {
  return text
    .split('')
    .map((ch, i) =>
      i < revealed || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
    )
    .join('');
}

// Teksti "dekoodautuu" satunnaisista merkeistä oikeaksi, kun se tulee näkyviin
export default function ScrambleText({ text, as: Tag = 'span', className, duration = 1400 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduceMotion = useReducedMotion();
  const [output, setOutput] = useState(text);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    let frame;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setOutput(scramble(text, Math.floor(progress * text.length)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, text, duration]);

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      <span aria-hidden="true">{output}</span>
    </Tag>
  );
}