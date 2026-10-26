// Pelialueen pelit. Kun peli on valmis, sille lisätään load-funktio, esim.
//   load: () => import('../games/zrunner/ZRunner.jsx'),
// Ilman loadia kortissa näkyy Rakenteilla-merkintä ja planned-lista, eikä peliä voi avata.
//
// color: korostusväri (magenta, cyan tai violet, ks. Games.css)
// ratio: pelinäkymän leveys jaettuna korkeudella
// planned: keskeneräisen pelin kortissa ohjaimien tilalla näytettävät tulevat ominaisuudet

export const GAMES = [
  {
    id: 'zrunner',
    name: 'Z-Runner',
    genre: 'Tasohyppely',
    color: 'magenta',
    ratio: 16 / 9,
    load: () => import('../games/zrunner/ZRunner.jsx'),
    description:
      'Pakene zombeja neonvaloisen yökaupungin halki ja kerää valopallot matkalla.',
    controls: {
      desktop: 'Nuolet, välilyönti ja X (lyönti)',
      mobile: 'Ruutunapit',
    },
  },
  {
    id: 'spacedriver',
    name: 'Space Driver 2026',
    genre: 'Avaruusammuskelu',
    color: 'cyan',
    ratio: 3 / 4,
    load: () => import('../games/spacedriver/SpaceDriver.jsx'),
    description: 'Lennä kolmen vihollislaivaston läpi, kerää tehostimia ja kaada pomo.',
    controls: {
      desktop: 'Nuolet tai WASD, välilyönti (pommi)',
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
    planned: ['6 rakennustyyppiä', 'Raha ja sähkö', 'Tavoite 1000 asukasta', 'Tallennus'],
    controls: {
      desktop: 'Hiiri',
      mobile: 'Napauta ruutua',
    },
  },
];