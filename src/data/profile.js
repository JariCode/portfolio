// Henkilö- ja yhteystiedot. Kuvat ja video ovat public-kansiossa.

export const profile = {
  name: 'Jari Karri',
  brand: 'JariCode',
  role: 'Web-ohjelmistokehittäjä',
  location: 'Kerava',
  email: 'jari.karri@elisanet.fi',
  phone: '045 898 5655',
  phoneHref: '+358458985655',
  site: 'www.jaricode.fi',

  // Hero
  heroStatus: 'Avoin työtarjouksille',
  heroText:
    'Tervetuloa tutustumaan projekteihini ja osaamiseeni. Tämä on paikka, jossa koodi kohtaa käytännön.',
  // Heron koodi-ikkunassa näkyvä osaaminen
  heroStack: ['React', 'Node.js', 'JavaScript', 'MySQL', 'Robot Framework'],

  // Esittely
  aboutLead: 'Hei! Nimeni on Jari Karri.',
  about: [
    'Olen ohjelmistokehittäjä, joka on suuntautunut erityisesti web-kehitykseen ja ohjelmistojen suunnitteluun.',
    'Olen kiinnostunut käyttöliittymien ja web-sovellusten toteuttamisesta sekä uusien teknologioiden oppimisesta.',
    'Vapaa-ajallani ulkoilen koirani kanssa, liikun ja retkeilen luonnossa. Harrastan myös kamppailulajeja, valo- ja videokuvausta, elokuvia sekä musiikkia. Nämä kehittävät luovuuttani ja visuaalista silmääni.',
  ],
  aboutClosing:
    'Etsin aktiivisesti työllistymismahdollisuuksia, joissa voin kehittää taitojani. Olen motivoitunut oppimaan uutta ja tekemään työni huolellisesti.',

  // Esittelykuvan ympärillä leijuvat laput.
  // Järjestys ratkaisee paikan: 6 ensimmäistä vasemmalle, 5 seuraavaa oikealle, viimeinen alareunaan.
  aboutTags: [
    // osaaminen (vasen reuna)
    'React', 'Node.js', 'JavaScript', 'HTML & CSS', 'MySQL', 'Robot Framework',
    // harrastukset (oikea reuna)
    'Kamppailulajit', 'Valokuvaus', 'Koira', 'Retkeily', 'Musiikki',
    // alareuna
    'Kerava',
  ],
  
  // Kuvat ja video
  aboutImg: 'img/esittely.webp',
  contactImg: 'img/yhteys.webp',
  cvPhoto: 'img/cv.webp',
  videoCv: 'video/VideoCv.mp4',
};

// contact: true = näytetään Ota yhteyttä -osion korteissa (puhelin ja sähköposti eivät näy sivulla)
export const socials = [
  { name: 'Sähköposti', href: 'mailto:jari.karri@elisanet.fi', icon: 'img/envelope.svg', contact: false },
  { name: 'WhatsApp', href: 'https://wa.me/358458985655', icon: 'img/whatsapp.svg', contact: false },
  { name: 'LinkedIn', handle: 'Jari Karri', href: 'https://fi.linkedin.com/in/jari-karri-04b09533b', icon: 'img/linkedin.svg', contact: true },
  { name: 'GitHub', handle: 'JariCode', href: 'https://github.com/JariCode', icon: 'img/github.svg', contact: true },
  { name: 'Instagram', handle: '@jari.karri', href: 'https://www.instagram.com/jari.karri/', icon: 'img/instagram.svg', contact: true },
  { name: 'Facebook', handle: 'Jari Karri', href: 'https://fi-fi.facebook.com/jari.karri', icon: 'img/facebook.svg', contact: true },
];