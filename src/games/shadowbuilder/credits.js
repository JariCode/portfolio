// Shadow Builderin tekijät. Lopputekstit luetaan tästä (vaihe 5).
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
];