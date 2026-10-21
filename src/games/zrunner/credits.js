// Z-Runnerin ulkopuoliset tiedostot ja niiden tekijät. Lopputekstit luetaan tästä.
// Lisää rivi heti, kun otat uuden tiedoston käyttöön: lähde ja lisenssi on helpointa
// kirjata latauksen yhteydessä. Itse tiedostot ovat public/audio/zrunner/ ja
// public/games/zrunner/ -kansioissa (eivät repossa).
//
// type:       'musiikki' | 'ääni' | 'tileset' | 'hahmo'
// name:       tiedoston tai paketin nimi lähteessä
// author:     tekijän nimi tai nimimerkki
// url:        vapaaehtoinen; sivu, jolta tiedosto ladattiin (Pixabay ei vaadi)
// license:    lisenssin nimi (esim. 'CC0', 'CC BY 4.0', 'Pixabay Content License')
// licenseUrl: linkki lisenssin ehtoihin
// file:       vapaaehtoinen; tiedoston nimi public/audio/zrunner/ -kansiossa
// changes:    vapaaehtoinen; mitä muokattiin (CC BY vaatii kertomaan muutoksista)

export const CREDITS = [
  {
    type: 'hahmo',
    name: 'Free Medieval Bandit 4-Direction Character Pack (Thug)',
    author: 'CraftPix.net',
    url: 'https://craftpix.net/freebies/free-medieval-bandit-4-direction-character-pack/',
    license: 'CraftPix Freebie License',
    licenseUrl: 'https://craftpix.net/file-licenses/',
    changes: 'Sivukuvat skaalattu ja koottu sprite-arkiksi',
  },
  {
    type: 'hahmo',
    name: '2D Zombie Free Sprite',
    author: 'CraftPix.net',
    url: 'https://craftpix.net/freebies/2d-game-zombie-character-free-sprite-pack-1/',
    license: 'CraftPix Freebie License',
    licenseUrl: 'https://craftpix.net/file-licenses/',
    changes: 'Ruudut kohdistettu, skaalattu ja koottu sprite-arkeiksi',
  },
  {
    type: 'hahmo',
    name: '2D Zombie Kids Free Sprite',
    author: 'CraftPix.net',
    url: 'https://craftpix.net/freebies/2d-game-zombie-kids-character-free-sprite-8/',
    license: 'CraftPix Freebie License',
    licenseUrl: 'https://craftpix.net/file-licenses/',
    changes: 'Ruudut kohdistettu, skaalattu ja koottu sprite-arkeiksi',
  },
  {
    type: 'musiikki',
    name: 'Instrumental Synthwave Background Music',
    author: 'UsefulPix',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'musiikki.mp3',
  },
  {
    type: 'musiikki',
    name: 'Intro Opening Titles Music',
    author: 'alex-morgan',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'intro.mp3',
  },
  {
    type: 'ääni',
    name: 'Man death scream',
    author: 'u_r7cny11q7r',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'zombi-kuolee.mp3',
  },
  {
    type: 'ääni',
    name: 'Punch',
    author: 'Universfield',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'lyonti.mp3',
  },
  {
    type: 'ääni',
    name: 'young man being hurt',
    author: 'pepsimanfan (Freesound), julkaisija freesound_community',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'osuma.mp3',
  },
  {
    type: 'ääni',
    name: 'Scary Scream',
    author: 'DRAGON-STUDIO',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'zombi-hyokkaa.mp3',
  },
  {
    type: 'ääni',
    name: 'Train #1',
    author: 'Phoenix_Connection_Brazil',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'juna.mp3',
  },
  {
    type: 'ääni',
    name: 'collect',
    author: 'Wagna (Freesound), julkaisija freesound_community',
    license: 'Pixabay Content License',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    file: 'keraa.mp3',
  },
];