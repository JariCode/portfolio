import { useEffect, useState } from 'react';
import { profile } from '../data/profile.js';
import { NAV_LINKS, linkHref } from '../data/nav.js';
import './Navbar.css';

// Etusivun osiot, joiden näkyvyyttä seurataan (omat sivut, kuten pelit, eivät ole osioita)
const SECTIONS = NAV_LINKS.filter((l) => !l.href);

// page: 'home' = etusivu, muuten sivun id (esim. 'pelit')
export default function Navbar({ page = 'home' }) {
  const home = page === 'home';
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  // Korostetaan linkki, jonka osio on näkymän keskellä (vain etusivulla, muualla osioita ei ole)
  useEffect(() => {
    if (!home) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [home]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
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
    <header className={`nav ${scrolled || !home ? 'nav--solid' : ''}`}>
      <a href={home ? '#top' : '/'} className="nav-logo" onClick={close}>
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
          {NAV_LINKS.map((link) => {
            // Oma sivu on aktiivinen, kun ollaan sillä; osio, kun se näkyy etusivulla
            const isActive = link.href ? page === link.id : home && active === link.id;
            return (
              <li key={link.id}>
                <a
                  href={linkHref(link, home)}
                  className={isActive ? 'is-active' : ''}
                  aria-current={isActive ? (link.href ? 'page' : 'location') : undefined}
                  onClick={close}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}