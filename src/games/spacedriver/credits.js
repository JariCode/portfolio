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
// vaadi mainintaa, mutta tekijät kerrotaan silti lopputeksteissä. Vihollispakettien
// keksittyjä laivastojen nimiä ei käytetä pelissä, joten paketit ovat numeroilla.
const VOID_AUTHOR = 'Baldur · Foozle';
const CC0 = 'CC0';
const CC0_URL = 'https://creativecommons.org/publicdomain/zero/1.0/';
const VOID_CHANGES = 'Valitut tiedostot nimetty uudelleen, ei muita muutoksia';

// Musiikki ja äänet: Pixabay. Lisenssi ei vaadi mainintaa, mutta tekijät kerrotaan silti.
// Freesoundista Pixabayhin siirretyissä äänissä tekijä on alkuperäinen tekijä ja
// julkaisija freesound_community (kuten Z-Runnerissa).
const PIXABAY = 'Pixabay Content License';
const PIXABAY_URL = 'https://pixabay.com/service/license-summary/';
const FREESOUND = '(Freesound), julkaisija freesound_community';

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
    name: 'Void – Fleet Pack 1',
    author: VOID_AUTHOR,
    url: 'https://foozlecc.itch.io/void-fleet-pack-1',
    license: CC0,
    licenseUrl: CC0_URL,
    changes: VOID_CHANGES,
  },
  {
    type: 'vihollinen',
    name: 'Void – Fleet Pack 2',
    author: VOID_AUTHOR,
    url: 'https://foozlecc.itch.io/void-fleet-pack-2',
    license: CC0,
    licenseUrl: CC0_URL,
    changes: VOID_CHANGES,
  },
  {
    type: 'vihollinen',
    name: 'Void – Fleet Pack 3',
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
  {
    type: 'tileset',
    name: 'Aseman raunio (asema.png)',
    author: 'Claude (Anthropic) · Piirretty koodilla',
    license: 'Tehty tätä peliä varten',
  },
  {
    type: 'tileset',
    name: 'Avaruussumu (sumu.png)',
    author: 'Claude (Anthropic) · Piirretty koodilla',
    license: 'Tehty tätä peliä varten',
  },
  {
    type: 'musiikki',
    name: 'Feel This Energy (Voyager)',
    author: 'AlexGrohl',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'musiikki.mp3',
  },
  {
    type: 'musiikki',
    name: 'Free Boss Fight Loop',
    author: 'C0mp0s3r69',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'pomo.mp3',
  },
  {
    type: 'musiikki',
    name: 'Space Ambient Music',
    author: 'Onetent',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'intro.mp3',
  },
  {
    type: 'ääni',
    name: 'laser shot ingame',
    author: 'RibhavAgrawal',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'ammus.mp3',
  },
  {
    type: 'ääni',
    name: 'Laser zap',
    author: `Hoscalegeek ${FREESOUND}`,
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'vihollisen-ammus.mp3',
  },
  {
    type: 'ääni',
    name: 'Metal Hit 12',
    author: 'floraphonic',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'osuma.mp3',
  },
  {
    type: 'ääni',
    name: 'Explosion',
    author: `morganpurkis ${FREESOUND}`,
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'rajahdys.mp3',
  },
  {
    type: 'ääni',
    name: 'Medium Explosion',
    author: `JuveriSetila ${FREESOUND}`,
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'pommi.mp3',
  },
  {
    type: 'ääni',
    name: 'Win',
    author: 'Musheran',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'tehostin.mp3',
  },
  {
    type: 'ääni',
    name: 'Hyper-Drive Spaceship Flyby',
    author: 'SoundShelfStudio',
    license: PIXABAY,
    licenseUrl: PIXABAY_URL,
    file: 'hyperhyppy.mp3',
  },
];