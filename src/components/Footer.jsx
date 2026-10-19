import { profile, socials } from '../data/profile.js';
import './Footer.css';

const LINKS = [
  { href: '#esittely', label: 'Esittely' },
  { href: '#projektit', label: 'Projektit' },
  { href: '#cv', label: 'CV' },
  { href: '#yhteys', label: 'Ota yhteyttä' },
];

// Maski asetetaan suoraan elementille: silloin suhteellinen polku (img/...) lasketaan
// sivun osoitteesta. CSS-muuttujan kautta polku laskettaisiin buildissa /assets/-kansiosta.
const iconMask = (icon) => ({ maskImage: `url(${icon})`, WebkitMaskImage: `url(${icon})` });

const FOOTER_SOCIALS = socials.filter((s) => s.contact);

export default function Footer({ onOpenPrivacy }) {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Neonviiva, jota pitkin valo kulkee */}
      <div className="footer-line" aria-hidden="true" />

      <div className="footer-inner">
        <div className="footer-brand">
          <a href="#top" className="footer-logo">
            {profile.name}
          </a>
          <p>{profile.role}</p>
        </div>

        <nav aria-label="Alavalikko">
          <ul className="footer-links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="footer-socials">
          {FOOTER_SOCIALS.map((s) => (
            <li key={s.name}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                <span className="footer-icon" style={iconMask(s.icon)} aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="footer-bottom">
        <p>
          © {year} {profile.brand}
        </p>
        <p className="footer-privacy-note">
          Ei evästeitä eikä analytiikkaa.{' '}
          <button type="button" className="footer-privacy" onClick={onOpenPrivacy}>
            Tietosuojaseloste
          </button>
        </p>
        <a href="#top" className="footer-top">
          Takaisin ylös
          <span className="footer-top-arrow" aria-hidden="true" />
        </a>
      </div>

      {/* Iso himmeä tunnus taustalla */}
      <p className="footer-ghost" aria-hidden="true">
        {profile.brand}
      </p>
    </footer>
  );
}