// Shadow Builderin tekijät. Lopputekstit (Outro.jsx) luetaan tästä.
// Lisää rivi heti, kun otat uuden tiedoston käyttöön: lähde ja lisenssi on helpointa
// kirjata latauksen yhteydessä. Äänet ovat public/audio/shadowbuilder/ -kansiossa (eivät repossa).
//
// type:       'grafiikka' | 'fontti' | 'musiikki' | 'ääni'
// name:       tiedoston tai paketin nimi lähteessä
// author:     tekijän nimi tai nimimerkki
// url:        vapaaehtoinen; sivu, jolta tiedosto ladattiin
// license:    lisenssin nimi
// licenseUrl: vapaaehtoinen; linkki lisenssin ehtoihin
// file:       vapaaehtoinen; tiedoston nimi public/audio/shadowbuilder/ -kansiossa

// Musiikki ja äänet: Pixabay. Lisenssi ei vaadi mainintaa, mutta tekijät kerrotaan silti
// (kuten muissa peleissä).
const PIXABAY = 'Pixabay Content License';
const PIXABAY_URL = 'https://pixabay.com/service/license-summary/';

export const CREDITS = [
  {
    type: 'grafiikka',
    name: 'Kaupunki, rakennukset ja varjojen vartija',
    author: 'Claude (Anthropic) · Piirretty koodilla',
    license: 'Tehty tätä peliä varten',
  },
  {
    type: 'fontti',
    name: 'Cinzel',
    author: 'Natanael Gama (The Cinzel Project Authors)',
    url: 'https://github.com/NDISCOVER/Cinzel',
    license: 'SIL Open Font License 1.1',
    licenseUrl: 'https://openfontlicense.org/',
  },
  {
    type: 'musiikki',
    name: 'Tokyo city - synthwave music',
    author: 'lofidreams',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'musiikki.mp3',
  },
  {
    type: 'musiikki',
    name: 'Le Royaume Blanc',
    author: 'MAFE70',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'intro.mp3',
  },
  {
    type: 'ääni',
    name: 'Hammer nails',
    author: 'spinopel',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'rakenna.mp3',
  },
  {
    type: 'ääni',
    name: 'BIGSMASH',
    author: 'Stu9',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'pura.mp3',
  },
  {
    type: 'ääni',
    name: 'Spinning Coin on Table',
    author: 'Universfield',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'raha.mp3',
  },
  {
    type: 'ääni',
    name: 'ERROR FX',
    author: 'dbsound',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'katko.mp3',
  },
  {
    type: 'ääni',
    name: 'Video Game Speak',
    author: 'CreatorsHome',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'puhe.mp3',
  },
  {
    type: 'ääni',
    name: 'Level Up 07',
    author: 'Universfield',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'luku.mp3',
  },
  {
    type: 'ääni',
    name: 'Aurora',
    author: 'u_loz16u6uca',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'revontulet.mp3',
  },
];