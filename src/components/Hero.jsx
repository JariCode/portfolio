import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { profile } from '../data/profile.js';
import CodeWindow from './CodeWindow.jsx';
import './Hero.css';

// Yksi neonkirjain: syttyy vuorollaan (CSS) ja kirkastuu + nousee, kun hiiri tulee lähelle
function Letter({ char, index, px, py }) {
  const ref = useRef(null);

  // 0 = hiiri kaukana, 1 = hiiri kirjaimen päällä
  const near = useTransform([px, py], ([x, y]) => {
    const el = ref.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    return Math.max(0, 1 - d / 220);
  });
  const smooth = useSpring(near, { stiffness: 200, damping: 20 });
  const y = useTransform(smooth, [0, 1], [0, -12]);
  const scale = useTransform(smooth, [0, 1], [1, 1.12]);
  const filter = useTransform(smooth, (v) => `brightness(${1 + v * 0.7})`);

  return (
    <motion.span ref={ref} className="hero-letter-wrap" style={{ y, scale, filter }}>
      <span className="hero-letter" style={{ '--i': index }}>
        {char}
      </span>
    </motion.span>
  );
}

const appear = (delay) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: 'easeOut' },
});

export default function Hero() {
  // Hiiren paikka koko ikkunassa
  const px = useMotionValue(-9999);
  const py = useMotionValue(-9999);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e) => {
      px.set(e.clientX);
      py.set(e.clientY);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [px, py, reduceMotion]);

  // Nimi riveittäin, kirjaimille juokseva järjestysnumero syttymisviivettä varten
  let count = 0;
  const lines = profile.name.split(' ').map((word) =>
    word.split('').map((char) => ({ char, index: count++ })),
  );

  return (
    <section id="top" className="hero">
      <div className="hero-intro">
        <motion.p className="hero-open" {...appear(0.2)}>
          <span className="hero-open-dot" aria-hidden="true" />
          {profile.heroStatus}
        </motion.p>

        <h1 className="hero-title">
          <span className="sr-only">{profile.name}, </span>
          <span className="hero-name" aria-hidden="true">
            {lines.map((line, li) => (
              <span key={li} className="hero-line">
                {line.map(({ char, index }) => (
                  <Letter key={index} char={char} index={index} px={px} py={py} />
                ))}
              </span>
            ))}
          </span>
          <span className="hero-role">{profile.role}</span>
        </h1>

        <motion.p className="hero-text" {...appear(1.6)}>
          {profile.heroText}
        </motion.p>

        <motion.div className="hero-actions" {...appear(1.8)}>
          <a href="#projektit" className="btn">Katso projektit</a>
          <a href="#yhteys" className="btn btn--cyan">Ota yhteyttä</a>
        </motion.div>
      </div>

      <div className="hero-code">
        <CodeWindow delay={1.8} />
      </div>

      <a href="#esittely" className="hero-scroll" aria-label="Siirry esittelyyn">
        <span />
      </a>
    </section>
  );
}