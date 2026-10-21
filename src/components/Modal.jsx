import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import './Modal.css';

// Yleinen modaali: tumma tausta, neonreunainen ikkuna, Esc ja taustan klikkaus sulkevat.
// initialFocus: elementti, joka saa fokuksen avattaessa (oletus Sulje-nappi). Peli antaa tähän
// pelinäkymänsä, jottei välilyönti tai Enter osu Sulje-nappiin kesken pelin.
// closeOnBackdrop: pelissä false, jottei ohi lipsahtanut klikkaus tai sormi sulje peliä.
export default function Modal({
  open,
  onClose,
  label,
  className = '',
  initialFocus,
  closeOnBackdrop = true,
  children,
}) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const previousFocus = document.activeElement; // palautetaan fokus sulkiessa
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden'; // sivu ei rullaa modaalin alla
    window.addEventListener('keydown', onKey);
    (initialFocus ?? closeRef).current?.focus();

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      previousFocus?.focus();
    };
  }, [open, onClose, initialFocus]);

  // Portaali piirtää modaalin suoraan bodyyn, jolloin mikään osion tyyli ei rajaa sitä
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          onClick={closeOnBackdrop ? onClose : undefined}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className={`modal ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          >
            <button ref={closeRef} type="button" className="modal-close" onClick={onClose} aria-label="Sulje">
              <span aria-hidden="true" />
            </button>
            {/* Sisältö omaan rullaavaan kääreeseen, jotta matala näyttö (esim. puhelin
                vaakatilassa) ei leikkaa traileria/sertifikaattia näkymättömiin */}
            <div className="modal-scroll">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}