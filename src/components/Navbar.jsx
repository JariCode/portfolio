import { useEffect, useState } from 'react';
import { profile } from '../data/profile.js';
import './Navbar.css';

// id:t vastaavat osioiden id-attribuutteja
const LINKS = [
  { id: 'esittely', label: 'Esittely' },
  { id: 'projektit', label: 'Projektit' },
  { id: 'cv', label: 'CV' },
  { id: 'yhteys', label: 'Ota yhteyttä' },
];

export default function Navbar() {
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Korostetaan linkki, jonka osio on näkymän keskellä
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );

    LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Esc sulkee mobiilivalikon
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Sivu ei saa rullata taustalla, kun kokoruudun mobiilivalikko on auki
  // (sama periaate kuin Modal.jsx:ssä)
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header className={`nav ${scrolled ? 'nav--solid' : ''}`}>
      <a href="#top" className="nav-logo" onClick={close}>
        {profile.brand}
      </a>

      <button
        type="button"
        className={`nav-burger ${open ? 'is-open' : ''}`}
        aria-label={open ? 'Sulje valikko' : 'Avaa valikko'}
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen((o) => !o)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav aria-label="Päävalikko">
        <ul id="nav-links" className={`nav-links ${open ? 'is-open' : ''}`}>
          {LINKS.map(({ id, label }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={active === id ? 'is-active' : ''}
                aria-current={active === id ? 'location' : undefined}
                onClick={close}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}