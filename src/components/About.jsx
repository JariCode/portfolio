import { useEffect, useRef, useState } from 'react';
import {
  motion,
  animate,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useTransform,
  useReducedMotion,
} from 'motion/react';
import { profile } from '../data/profile.js';
import ScrambleText from './ScrambleText.jsx';
import './About.css';

// Neonlappujen paikat kuvan ympärillä ja "syvyys" (isompi = liikkuu enemmän hiiren mukana).
// Yksi paikka jokaiselle lapulle: aboutTags-listan järjestys = tämän listan järjestys.
const SPOTS = [
  // vasen reuna: osaaminen
  { pos: { top: '2%', left: '-14%' }, depth: 1.4, color: 'cyan' },
  { pos: { top: '17%', left: '-22%' }, depth: 1.9, color: 'cyan' },
  { pos: { top: '32%', left: '-12%' }, depth: 1.1, color: 'cyan' },
  { pos: { top: '47%', left: '-21%' }, depth: 1.7, color: 'cyan' },
  { pos: { top: '62%', left: '-13%' }, depth: 1.2, color: 'cyan' },
  { pos: { top: '77%', left: '-24%' }, depth: 1.5, color: 'cyan' },
  // oikea reuna: harrastukset
  { pos: { top: '-5%', right: '8%' }, depth: 0.8, color: 'magenta' },
  { pos: { top: '12%', right: '-18%' }, depth: 1.6, color: 'magenta' },
  { pos: { top: '30%', right: '-10%' }, depth: 1.2, color: 'magenta' },
  { pos: { top: '48%', right: '-20%' }, depth: 1.9, color: 'magenta' },
  { pos: { top: '66%', right: '-11%' }, depth: 1.3, color: 'magenta' },
  // alareuna: sijainti
  { pos: { bottom: '-6%', left: '22%' }, depth: 0.9, color: 'violet' },
];

// Kaikki esittelyn kappaleet yhtenä listana; viimeinen korostetaan
const PARAGRAPHS = [
  ...profile.about.map((text) => ({ text, highlight: false })),
  { text: profile.aboutClosing, highlight: true },
];

const SPEED = 26; // rullausnopeus pikseleinä sekunnissa

// Leijuva lappu: kelluu omaa tahtiaan (CSS) ja siirtyy hiiren mukana (motion)
function FloatingTag({ label, spot, index, mx, my }) {
  const x = useTransform(mx, (v) => v * spot.depth * 70);
  const y = useTransform(my, (v) => v * spot.depth * 70);

  return (
    <motion.span className="about-tag-wrap" style={{ ...spot.pos, x, y }}>
      <span
        className={`about-tag about-tag--${spot.color}`}
        style={{ '--float': `${5 + (index % 4) * 1.3}s`, '--delay': `${index * -0.7}s` }}
      >
        {label}
      </span>
    </motion.span>
  );
}

function Paragraphs({ hidden }) {
  return (
    <div className="about-block" aria-hidden={hidden || undefined}>
      {PARAGRAPHS.map(({ text, highlight }) => (
        <p key={text} className={`about-p ${highlight ? 'about-closing' : ''}`}>
          {text}
        </p>
      ))}
    </div>
  );
}

// Teksti rullaa ikkunassa itsestään loputtomana silmukkana
function AutoScroll() {
  const reduceMotion = useReducedMotion();
  const blockRef = useRef(null);
  const controls = useRef(null);
  const y = useMotionValue(0);
  const [paused, setPaused] = useState(false); // käyttäjän napilla valitsema tila
  const [hover, setHover] = useState(false);

  // Käynnistetään silmukka: siirretään yhden tekstilohkon korkeuden verran ja aloitetaan alusta.
  // Lohkoja on kaksi peräkkäin, joten hyppy alkuun ei näy.
  useEffect(() => {
    if (reduceMotion) return;
    const height = blockRef.current.offsetHeight;
    controls.current = animate(y, [0, -height], {
      duration: height / SPEED,
      ease: 'linear',
      repeat: Infinity,
    });
    return () => controls.current.stop();
  }, [reduceMotion, y]);

  // Pysäytys napista tai kun hiiri / näppäimistön fokus on tekstin päällä
  useEffect(() => {
    if (!controls.current) return;
    if (paused || hover) controls.current.pause();
    else controls.current.play();
  }, [paused, hover]);

  if (reduceMotion) {
    return (
      <div className="about-static">
        <Paragraphs />
      </div>
    );
  }

  return (
    <div className="about-scroller">
      <div
        className="about-window"
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
      >
        <motion.div style={{ y }}>
          <div ref={blockRef}>
            <Paragraphs />
          </div>
          <Paragraphs hidden />
        </motion.div>
      </div>

      <button type="button" className="about-pause" onClick={() => setPaused((p) => !p)}>
        <span className={`about-pause-icon ${paused ? 'is-paused' : ''}`} aria-hidden="true" />
        {paused ? 'Jatka rullausta' : 'Pysäytä rullaus'}
      </button>
    </div>
  );
}

export default function About() {
  const reduceMotion = useReducedMotion();

  // Hiiren paikka osion sisällä: -0.5 … 0.5 molemmilla akseleilla
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // Kuvan kallistus seuraa hiirtä pehmeästi (jousi)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 120, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 120, damping: 18 });

  // Taustavalo hiiren kohdalla
  const lightX = useTransform(mx, [-0.5, 0.5], [0, 100]);
  const lightY = useTransform(my, [-0.5, 0.5], [0, 100]);
  const light = useMotionTemplate`radial-gradient(600px circle at ${lightX}% ${lightY}%, rgb(41 224 255 / 0.1), transparent 70%)`;

  function onMove(e) {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }

  function onLeave() {
    mx.set(0);
    my.set(0);
  }

  return (
    <section id="esittely" className="about" onPointerMove={onMove} onPointerLeave={onLeave}>
      <motion.div className="about-light" style={{ background: light }} aria-hidden="true" />

      {/* Osion otsikko samalla tyylillä kuin muissa osioissa (section-title) */}
      <ScrambleText as="h2" className="section-title about-title" text="Esittely" />

      <div className="about-stage">
        <motion.figure className="hud-photo" style={{ rotateX, rotateY }}>
          <img src={profile.aboutImg} alt={profile.name} width="480" height="640" loading="lazy" />

          {/* Hoverissa välähtävä häiriökopio */}
          <img className="hud-glitch" src={profile.aboutImg} alt="" aria-hidden="true" />

          {/* HUD: kulmat, skannausviiva ja tunnistetiedot */}
          <div className="hud" aria-hidden="true">
            <span className="hud-corner hud-corner--tl" />
            <span className="hud-corner hud-corner--tr" />
            <span className="hud-corner hud-corner--bl" />
            <span className="hud-corner hud-corner--br" />
            <span className="hud-scan" />
            <span className="hud-label hud-label--top">
              <span className="hud-dot" /> {profile.name}
            </span>
            <span className="hud-label hud-label--bottom">
              {profile.location} / {profile.role}
            </span>
          </div>
        </motion.figure>

        <div className="about-tags" aria-hidden="true">
          {profile.aboutTags.map((label, i) => (
            <FloatingTag key={label} label={label} spot={SPOTS[i % SPOTS.length]} index={i} mx={mx} my={my} />
          ))}
        </div>
      </div>

      <div className="about-copy">
        {/* h3, koska "Esittely" (yllä) on nyt osion varsinainen h2-otsikko */}
        <ScrambleText as="h3" className="about-lead" text={profile.aboutLead} />
        <AutoScroll />
      </div>
    </section>
  );
}