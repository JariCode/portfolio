// Navin ja footerin yhteiset linkit.
// id ilman hrefiä = etusivun osio (id vastaa osion id-attribuuttia).
// href = oma sivunsa.
export const NAV_LINKS = [
  { id: 'esittely', label: 'Esittely' },
  { id: 'projektit', label: 'Projektit' },
  { id: 'pelit', label: 'Pelialue', href: '/pelit/' },
  { id: 'cv', label: 'CV' },
  { id: 'yhteys', label: 'Ota yhteyttä' },
];

// Etusivulla osiolinkki on pelkkä ankkuri, muilla sivuilla se vie ensin etusivulle
export const linkHref = (link, home) => link.href ?? (home ? `#${link.id}` : `/#${link.id}`);