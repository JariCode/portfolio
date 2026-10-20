import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, animate, useInView, useMotionValue, useReducedMotion } from 'motion/react';
import { PROJECTS, FILTERS, matchesFilter, projectAction } from '../data/projects.js';
import ScrambleText from './ScrambleText.jsx';
import Modal from './Modal.jsx';
import './Projects.css';

const DURATION = 6; // sekuntia per projekti automaattisessa vaihdossa

// Kuva tai, jos kuvaa ei ole, neonkuvio projektin alkukirjaimilla
function ProjectImage({ project, className }) {
  if (project.img) {
    // fit: 'contain' → kuva näytetään kokonaisena (esim. logo), muuten se täyttää kehyksen
    const fitClass = project.fit === 'contain' ? ' proj-img--contain' : '';
    return <img className={className + fitClass} src={project.img} alt="" loading="lazy" draggable="false" />;
  }
  // Lyhyt ensimmäinen sana kokonaan ("AI-sivu" → AI), muuten alkukirjain ("Palkkiolaskuri" → P)
  const first = project.name.split(/[\s-]/)[0];
  const initials = first.length <= 3 ? first : first[0];
  return (
    <div className={`${className} proj-fallback`} aria-hidden="true">
      <span>{initials}</span>
    </div>
  );
}

// Projektin päänappi: traileri avautuu sivulle, muut linkit uuteen välilehteen
function ActionButton({ project, onVideo, className = 'btn' }) {
  const action = projectAction(project);
  if (action.kind === 'video') {
    return (
      <button type="button" className={className} onClick={() => onVideo(project, action.videoId)}>
        <span className="play-icon" aria-hidden="true" />
        {action.label}
      </button>
    );
  }
  return (
    <a className={`${className} btn--cyan`} href={project.url} target="_blank" rel="noopener noreferrer">
      {action.label}
    </a>
  );
}

export default function Projects() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef(null);
  const railRef = useRef(null);
  const controls = useRef(null);
  const inView = useInView(sectionRef, { amount: 0.35 });

  const [filter, setFilter] = useState('all');
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState(false);
  const [paused, setPaused] = useState(false);
  const [video, setVideo] = useState(null); // { project, videoId } kun traileri on auki

  const list = PROJECTS.filter((p) => matchesFilter(p, filter));
  const project = list[index] ?? list[0];
  const progress = useMotionValue(0);

  // Automaattinen vaihto käy vain, kun osio näkyy eikä käyttäjä ole sen päällä
  const running = inView && !hover && !paused && !video && !reduceMotion;

  // Jokaiselle projektille oma ajastin: palkki täyttyy, sitten seuraava
  useEffect(() => {
    progress.set(0);
    controls.current = animate(progress, 1, {
      duration: DURATION,
      ease: 'linear',
      onComplete: () => setIndex((i) => (i + 1) % list.length),
    });
    return () => controls.current.stop();
  }, [index, filter, list.length, progress]);

  // Tauko / jatko tilan mukaan (ajetaan myös heti uuden ajastimen jälkeen)
  useEffect(() => {
    if (running) controls.current.play();
    else controls.current.pause();
  }, [running, index, filter]);

  // Aktiivinen pienoiskuva rivin keskelle (vain vaakasuunnassa, sivu ei hypi)
  useEffect(() => {
    const rail = railRef.current;
    const thumb = rail?.children[index];
    if (!thumb) return;
    rail.scrollTo({
      left: thumb.offsetLeft - rail.clientWidth / 2 + thumb.clientWidth / 2,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [index, filter, reduceMotion]);

  const go = (step) => setIndex((i) => (i + step + list.length) % list.length);

  function chooseFilter(id) {
    setFilter(id);
    setIndex(0);
  }

  // Pyyhkäisy kuvassa vaihtaa projektia (kosketusnäytöt ja hiiri)
  function onSwipe(_, info) {
    if (info.offset.x < -60) go(1);
    else if (info.offset.x > 60) go(-1);
  }

  const counter = (n) => String(n).padStart(2, '0');

  return (
    <section
      id="projektit"
      ref={sectionRef}
      className="section projects"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div className="proj-head">
        <ScrambleText as="h2" className="section-title" text="Projektit" />

        <div className="proj-filters" role="group" aria-label="Suodata projekteja">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`proj-filter ${filter === f.id ? 'is-active' : ''}`}
              aria-pressed={filter === f.id}
              onClick={() => chooseFilter(f.id)}
            >
              {filter === f.id && <motion.span layoutId="filter-glow" className="proj-filter-glow" />}
              <span className="proj-filter-label">{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ═══ Esittelylava ═══ */}
      <div className="proj-stage">
        <motion.div
          className="proj-media"
          drag={reduceMotion ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={onSwipe}
        >
          {/* Kehykset ovat valmiiksi position: absolute päällekkäin, joten popLayout-tilaa ei tarvita.
              popLayout lisäisi sivulle <style>-elementin, jonka CSP estää. */}
          <AnimatePresence initial={false}>
            <motion.div
              key={project.name}
              className="proj-media-frame"
              initial={{ opacity: 0, clipPath: 'inset(0 0 0 100%)', scale: 1.08 }}
              animate={{ opacity: 1, clipPath: 'inset(0 0 0 0%)', scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProjectImage project={project} className="proj-media-img" />
            </motion.div>
          </AnimatePresence>

          {/* HUD-kulmat ja tila */}
          <div className="proj-hud" aria-hidden="true">
            <span className="hud-corner hud-corner--tl" />
            <span className="hud-corner hud-corner--tr" />
            <span className="hud-corner hud-corner--bl" />
            <span className="hud-corner hud-corner--br" />
          </div>
          <span className={`proj-status proj-status--${project.status}`}>
            {project.status === 'wip' ? 'Työn alla' : 'Valmis'}
          </span>

          {projectAction(project).kind === 'video' && (
            <button
              type="button"
              className="proj-play"
              aria-label={`Katso ${project.name} -traileri`}
              onClick={() => setVideo({ project, videoId: projectAction(project).videoId })}
            >
              <span className="play-icon" aria-hidden="true" />
            </button>
          )}
        </motion.div>

        <div className="proj-info">
          <p className="proj-counter" aria-live="polite">
            <span>{counter(index + 1)}</span> / {counter(list.length)}
          </p>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={project.name}
              className="proj-text"
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: { opacity: 0, y: 12, transition: { duration: 0.2 } },
                show: { opacity: 1, y: 0, transition: { staggerChildren: 0.07 } },
              }}
            >
              <motion.h3 variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                {project.name}
              </motion.h3>
              <motion.p variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                {project.desc}
              </motion.p>
              <motion.ul
                className="chip-list"
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
              >
                {project.tech.map((t) => (
                  <li key={t} className="chip">{t}</li>
                ))}
              </motion.ul>
              <motion.div variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}>
                <ActionButton project={project} onVideo={(p, id) => setVideo({ project: p, videoId: id })} />
              </motion.div>
            </motion.div>
          </AnimatePresence>

          <div className="proj-controls">
            <button type="button" className="proj-arrow" onClick={() => go(-1)} aria-label="Edellinen projekti">
              <span aria-hidden="true" className="arrow arrow--left" />
            </button>
            <div className="proj-progress" aria-hidden="true">
              <motion.span style={{ scaleX: progress }} />
            </div>
            <button type="button" className="proj-arrow" onClick={() => go(1)} aria-label="Seuraava projekti">
              <span aria-hidden="true" className="arrow arrow--right" />
            </button>
            <button
              type="button"
              className="proj-pause"
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Jatka automaattista vaihtoa' : 'Pysäytä automaattinen vaihto'}
            >
              <span className={`pause-icon ${paused ? 'is-paused' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Pienoiskuvarivi ═══ */}
      <div ref={railRef} className="proj-rail">
        {list.map((p, i) => (
          <button
            key={p.name}
            type="button"
            className={`proj-thumb ${i === index ? 'is-active' : ''}`}
            onClick={() => setIndex(i)}
            aria-label={`Näytä ${p.name}`}
            aria-current={i === index ? 'true' : undefined}
          >
            <ProjectImage project={p} className="proj-thumb-img" />
            <span className="proj-thumb-name">{p.name}</span>
          </button>
        ))}
      </div>

      {/* ═══ Traileri ═══ */}
      <Modal
        open={!!video}
        onClose={() => setVideo(null)}
        label={video ? `${video.project.name} -traileri` : ''}
        className="modal--video"
      >
        {video && (
          <div className="video-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`}
              title={`${video.project.name} -traileri`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
          </div>
        )}
      </Modal>
    </section>
  );
}