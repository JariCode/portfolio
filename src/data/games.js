// Pelialueen pelit. Kun peli on valmis, sille lisätään load-funktio, esim.
//   load: () => import('../games/zrunner/ZRunner.jsx'),
// Ilman loadia peli näkyy kortilla, mutta pelinäkymässä lukee "rakenteilla".
//
// color: korostusväri (magenta, cyan tai violet, ks. Games.css)
// ratio: pelinäkymän leveys jaettuna korkeudella

export const GAMES = [
  {
    id: 'zrunner',
    name: 'Z-Runner',
    genre: 'Tasohyppely',
    color: 'magenta',
    ratio: 16 / 9,
    description:
      'Juokse neonvaloisen yökaupungin halki, väistele zombeja ja kerää tavarat ennen maalia.',
    controls: {
      desktop: 'Nuolinäppäimet ja välilyönti',
      mobile: 'Ruutunapit',
    },
  },
  {
    id: 'spacedriver',
    name: 'Space Driver 2026',
    genre: 'Avaruusammuskelu',
    color: 'cyan',
    ratio: 3 / 4,
    description:
      'Ohjaa alusta vihollisaaltojen läpi. Vauhti kiihtyy aalto aallolta, ja lopussa odottaa pomo.',
    controls: {
      desktop: 'Hiiri tai nuolinäppäimet',
      mobile: 'Vedä alusta sormella',
    },
  },
  {
    id: 'shadowbuilder',
    name: 'Shadow Builder',
    genre: 'Kaupunginrakennus',
    color: 'violet',
    ratio: 1,
    description:
      'Rakenna yökaupunki tyhjästä. Pidä sähköt päällä, kassa plussalla ja kasvata väkiluku tuhanteen.',
    controls: {
      desktop: 'Hiiri',
      mobile: 'Napauta ruutua',
    },
  },
];