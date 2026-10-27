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
      desktop: 'Nuolet tai WASD, välilyönti ampuu, B pommi',
      mobile: 'Vedä alusta sormella, ammu ja pommita napeista',
    },
  },
  {
    id: 'shadowbuilder',
    name: 'Shadow Builder',
    genre: 'Kaupunginrakennus',
    color: 'violet',
    ratio: 1,
    load: () => import('../games/shadowbuilder/ShadowBuilder.jsx'),
    description:
      'Rakenna yökaupunki tyhjästä. Pidä sähköt päällä, kassa plussalla ja kasvata väkiluku tuhanteen.',
    controls: {
      desktop: 'Hiiri, numerot 1–7 ja välilyönti (tauko)',
      mobile: 'Valitse valikosta, napauta ruutua',
    },
  },
];