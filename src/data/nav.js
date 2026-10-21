// Navin ja footerin yhteiset linkit etusivun osioihin (id vastaa osion id-attribuuttia)
export const NAV_LINKS = [
  { id: 'esittely', label: 'Esittely' },
  { id: 'projektit', label: 'Projektit' },
  { id: 'cv', label: 'CV' },
  { id: 'yhteys', label: 'Ota yhteyttä' },
];

// Pelialue on oma sivunsa, ei etusivun osio: se näytetään erillisenä nappina (GamesLink.jsx)
export const GAMES_LINK = { id: 'pelit', label: 'Pelialue', href: '/pelit/' };

// Etusivulla osiolinkki on pelkkä ankkuri, muilla sivuilla se vie ensin etusivulle
export const linkHref = (link, home) => (home ? `#${link.id}` : `/#${link.id}`);