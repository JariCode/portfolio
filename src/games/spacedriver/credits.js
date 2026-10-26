// Space Driverin ulkopuoliset tiedostot ja niiden tekijät. Lopputekstit luetaan tästä.
// Lisää rivi heti, kun otat uuden tiedoston käyttöön: lähde ja lisenssi on helpointa
// kirjata latauksen yhteydessä. Itse tiedostot ovat public/audio/spacedriver/ ja
// public/games/spacedriver/ -kansioissa (eivät repossa).
//
// type:       'alus' | 'vihollinen' | 'tehostin' | 'musiikki' | 'ääni' | 'tileset'
// name:       tiedoston tai paketin nimi lähteessä
// author:     tekijän nimi tai nimimerkki
// url:        vapaaehtoinen; sivu, jolta tiedosto ladattiin (Pixabay ei vaadi)
// license:    lisenssin nimi (esim. 'CC0', 'CC BY 4.0', 'Pixabay Content License')
// licenseUrl: linkki lisenssin ehtoihin
// file:       vapaaehtoinen; tiedoston nimi public/audio/spacedriver/ -kansiossa
// changes:    vapaaehtoinen; mitä muokattiin (CC BY vaatii kertomaan muutoksista)

// Void-sarjan paketit: piirtäjä Baldur (tilaustyö), julkaisija Foozle. Lisenssi CC0 ei
// vaadi mainintaa, mutta tekijät kerrotaan silti lopputeksteissä.
const VOID_AUTHOR = 'Baldur · Foozle';
const CC0 = 'CC0';
const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
const VOID_CHANGES = 'Valitut tiedostot nimetty uudelleen, ei muita muutoksia';

export const CREDITS = [
  {
    type: 'alus',
    name: 'Void – Main Ship',
    author: VOID_AUTHOR,
    url: 'https://foozlecc.itch.io/void-main-ship',
    license: CC0,
    licenseUrl: CC0_URL,
    changes: VOID_CHANGES,
  },
  {
    type: 'vihollinen',
    name: "Void – Fleet Pack 1 – Kla'ed",
    author: VOID_AUTHOR,
    url: 'https://foozlecc.itch.io/void-fleet-pack-1',
    license: CC0,
    licenseUrl: CC0_URL,
    changes: VOID_CHANGES,
  },
  {
    type: 'vihollinen',
    name: 'Void – Fleet Pack 2 – Nairan',
    author: VOID_AUTHOR,
    url: 'https://foozlecc.itch.io/void-fleet-pack-2',
    license: CC0,
    licenseUrl: CC0_URL,
    changes: VOID_CHANGES,
  },
  {
    type: 'vihollinen',
    name: 'Void – Fleet Pack 3 – Nautolan',
    author: VOID_AUTHOR,
    url: 'https://foozlecc.itch.io/void-fleet-pack-3',
    license: CC0,
    licenseUrl: CC0_URL,
    changes: VOID_CHANGES,
  },
  {
    type: 'tehostin',
    name: 'Void – Pickups Pack',
    author: VOID_AUTHOR,
    url: 'https://foozlecc.itch.io/void-pickups-pack',
    license: CC0,
    licenseUrl: CC0_URL,
    changes: VOID_CHANGES,
  },
  {
    type: 'tileset',
    name: 'Asteroidikenttä (asteroidit.png)',
    author: 'Claude (Anthropic) · Piirretty koodilla',
    license: 'Tehty tätä peliä varten',
  },
];