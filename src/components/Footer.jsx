import { profile, socials } from '../data/profile.js';
import { NAV_LINKS, linkHref } from '../data/nav.js';
import './Footer.css';

// Maski asetetaan suoraan elementille: CSS-muuttujan kautta polku laskettaisiin buildissa
// /assets/-kansiosta. Kauttaviiva eteen, koska footer näkyy myös /pelit/-sivulla, jossa
// pelkkä img/... osoittaisi kansioon /pelit/img/.
const iconMask = (icon) => {
  const src = `url(/${icon})`;
  return { maskImage: src, WebkitMaskImage: src };
};

const FOOTER_SOCIALS = socials.filter((s) => s.contact);

export default function Footer({ page = 'home', onOpenPrivacy }) {
  const home = page === 'home';
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Neonviiva, jota pitkin valo kulkee */}
      <div className="footer-line" aria-hidden="true" />

      <div className="footer-inner">
        <div className="footer-brand">
          <a href={home ? '#top' : '/'} className="footer-logo">
            {profile.name}
          </a>
          <p>{profile.role}</p>
        </div>

        <nav aria-label="Alavalikko">
          <ul className="footer-links">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <a href={linkHref(l, home)}>{l.label}</a>
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