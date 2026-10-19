import { useRef, useState } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform, useReducedMotion } from 'motion/react';
import { profile } from '../data/profile.js';
import { work, education, skills, certificates } from '../data/cv.js';
import ScrambleText from './ScrambleText.jsx';
import Modal from './Modal.jsx';
import CvDocument from './CvDocument.jsx';
import './Cv.css';

// ═══ Aikajana: viiva piirtyy rullatessa, asemat syttyvät kun ne tulevat näkyviin ═══
function Timeline({ title, items, color }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.6'] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });

  return (
    <div ref={ref} className={`timeline timeline--${color}`}>
      <h3 className="timeline-title">{title}</h3>
      <div className="timeline-track">
        <motion.span className="timeline-line" style={{ scaleY }} aria-hidden="true" />
        <ol>
          {items.map((item) => (
            <motion.li
              key={item.title + item.time}
              className="timeline-item"
              initial="off"
              whileInView="on"
              viewport={{ once: true, margin: '0px 0px -20% 0px' }}
            >
              <motion.span
                className="timeline-dot"
                aria-hidden="true"
                variants={{ off: { scale: 0.4, opacity: 0.3 }, on: { scale: 1, opacity: 1 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              />
              <motion.div
                className="timeline-card"
                variants={{ off: { opacity: 0, x: -20 }, on: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <p className="timeline-time">{item.time}</p>
                <h4>{item.title}</h4>
                <p className="timeline-text">{item.text}</p>
              </motion.div>
            </motion.li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ═══ Sertifikaattikortti: kallistuu hiiren mukaan, avautuu isoksi klikatessa ═══
function CertCard({ cert, onOpen }) {
  const reduceMotion = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 200, damping: 18 });
  const rotateY = useSpring(ry, { stiffness: 200, damping: 18 });
  const glareX = useTransform(rotateY, [-12, 12], ['0%', '100%']);

  function onMove(e) {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 24);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 24);
  }

  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.button
      type="button"
      className="cert-card"
      style={{ rotateX, rotateY }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onClick={() => onOpen(cert)}
      aria-label={`Avaa sertifikaatti: ${cert.name}`}
    >
      <img src={cert.img} alt="" loading="lazy" />
      <motion.span className="cert-glare" style={{ '--x': glareX }} aria-hidden="true" />
      <span className="cert-name">{cert.name}</span>
    </motion.button>
  );
}

export default function Cv() {
  const [modal, setModal] = useState(null); // 'cv' | 'video' | sertifikaattiolio
  const close = () => setModal(null);
  const cert = modal && typeof modal === 'object' ? modal : null;

  // Video-CV:n esikatselu pyörii äänettä, kun hiiri on kortin päällä
  const previewRef = useRef(null);
  const playPreview = () => previewRef.current?.play().catch(() => {});
  const stopPreview = () => previewRef.current?.pause();

  return (
    <section id="cv" className="section cv">
      <ScrambleText as="h2" className="section-title" text="CV" />

      {/* ═══ Avattavat kortit ═══ */}
      <div className="cv-tiles">
        <button type="button" className="cv-tile cv-tile--doc" onClick={() => setModal('cv')}>
          <span className="cv-tile-preview" aria-hidden="true">
            <img src={profile.cvPhoto} alt="" />
            <span className="cv-lines">
              <span /><span /><span /><span /><span /><span />
            </span>
          </span>
          <span className="cv-tile-text">
            <span className="cv-tile-title">Avaa CV</span>
            <span className="cv-tile-sub">Koko CV yhdellä sivulla, tulostettavissa PDF:ksi</span>
          </span>
        </button>

        <button
          type="button"
          className="cv-tile cv-tile--video"
          onClick={() => setModal('video')}
          onPointerEnter={playPreview}
          onPointerLeave={stopPreview}
        >
          <span className="cv-tile-preview" aria-hidden="true">
            <video ref={previewRef} src={`${profile.videoCv}#t=1`} muted loop playsInline preload="metadata" />
            <span className="cv-play">
              <span className="play-icon" />
            </span>
          </span>
          <span className="cv-tile-text">
            <span className="cv-tile-title">Katso video-CV</span>
            <span className="cv-tile-sub">Esittelen itseni videolla</span>
          </span>
        </button>
      </div>

      {/* ═══ Osaaminen liukuvana nauhana ═══ */}
      <div className="skill-marquee" aria-label="IT-taidot">
        <ul className="skill-track">
          {[...skills, ...skills].map((s, i) => (
            <li key={i} aria-hidden={i >= skills.length || undefined}>
              {s}
            </li>
          ))}
        </ul>
      </div>

      {/* ═══ Aikajanat ═══ */}
      <div className="timelines">
        <Timeline title="Työkokemus" items={work} color="magenta" />
        <Timeline title="Koulutus" items={education} color="cyan" />
      </div>

      {/* ═══ Sertifikaatit ═══ */}
      <h3 className="cert-heading">Sertifikaatit</h3>
      <div className="cert-grid">
        {certificates.map((c) => (
          <CertCard key={c.name} cert={c} onOpen={setModal} />
        ))}
      </div>

      {/* ═══ Modaalit ═══ */}
      <Modal open={modal === 'cv'} onClose={close} label="CV" className="modal--doc">
        <CvDocument />
      </Modal>

      <Modal open={modal === 'video'} onClose={close} label="Video-CV" className="modal--video">
        <div className="video-frame">
          <video src={profile.videoCv} controls autoPlay playsInline controlsList="nodownload" />
        </div>
      </Modal>

      <Modal open={!!cert} onClose={close} label={cert ? cert.name : ''} className="modal--cert">
        {cert && (
          <div className="cert-view">
            <img src={cert.img} alt={cert.name} />
            <div className="cert-view-bar">
              <h3>{cert.name}</h3>
              <a className="btn btn--cyan" href={cert.url} target="_blank" rel="noopener noreferrer">
                Tarkista varmenne
              </a>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}