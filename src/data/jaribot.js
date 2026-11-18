// Jari-Botin "aivot": tunnistaa kysymyksen aiheen avainsanoista ja muodostaa vastauksen
// sivun omista tiedoista. Ei tekoälyä eikä verkkoa: kaikki tapahtuu selaimessa, ja kun
// projektit, pelit tai CV muuttuvat, botti tietää muutoksen heti. Poikkeus: "Mitä Jari osaa?"
// on kirjoitettu käsin (skills), joten uusi taito lisätään myös sinne.
//
// Turvallisuus:
//  - Kävijän teksti käsitellään vain merkkijonona (includes), sitä ei koskaan suoriteta,
//    tulkita säännöllisenä lausekkeena eikä lisätä sivulle HTML:nä.
//  - Pituus rajataan ja ohjausmerkit poistetaan ennen käsittelyä.
//  - Linkit tulevat vain tästä tiedostosta ja datasta, ja ne tarkistetaan (safeHref):
//    sisäinen ankkuri tai https-osoite, ei koskaan javascript: tai data:.
//  - Puhelinnumeroa ja sähköpostia ei kerrota: Jari on piilottanut ne sivulta.

import { profile, socials } from './profile.js';
import { PROJECTS, projectAction } from './projects.js';
import { work, education, languages, certificates, courses, hobbies } from './cv.js';
import { GAMES } from './games.js';

export const MAX_INPUT = 200;

// Aloitusviesti ja sen alla näkyvät aihenapit
export const GREETING =
  'Hei! Olen Jari-Bot. Kerron mielelläni Jarin osaamisesta, projekteista ja CV:stä. Mitä haluaisit tietää?';
export const START_CHIPS = ['about', 'skills', 'projects', 'games', 'cv', 'contact'];

// Kaikki aiheet siinä järjestyksessä, jossa niitä tarjotaan napeiksi
const ALL_CHIPS = [
  'about', 'skills', 'projects', 'wip', 'games', 'work', 'education', 'certs',
  'languages', 'hobbies', 'location', 'job', 'cv', 'contact', 'site', 'privacy',
];
const CHIP_COUNT = 6;

// Vastauksen alle näytettävät napit: ensin vastaukseen liittyvät aiheet, sitten aiheet,
// joita ei ole vielä kysytty. Näin koko sisällön voi käydä läpi pelkillä napeilla.
export function chipsFor(answer, asked) {
  const pool = [...new Set([...(answer.chips ?? []), ...ALL_CHIPS])].filter(
    (id) => id !== answer.topic && CHIP_LABELS[id],
  );
  const fresh = pool.filter((id) => !asked.has(id));
  // Kun kaikki on kysytty, tarjotaan taas liittyvät aiheet
  return (fresh.length ? fresh : pool).slice(0, CHIP_COUNT);
}

// Aihenappien tekstit
export const CHIP_LABELS = {
  about: 'Kuka Jari on?',
  skills: 'Mitä Jari osaa?',
  projects: 'Projektit',
  wip: 'Mitä on työn alla?',
  games: 'Pelit',
  work: 'Työkokemus',
  education: 'Koulutus',
  certs: 'Sertifikaatit',
  languages: 'Kielitaito',
  cv: 'CV',
  hobbies: 'Harrastukset',
  job: 'Onko Jari vapaana?',
  contact: 'Ota yhteyttä',
  location: 'Missä Jari asuu?',
  site: 'Miten tämä sivu on tehty?',
  privacy: 'Tietosuoja',
};

// Sisäiset linkit: osion id etusivulla. JariBotChat muuttaa ne sivun mukaan (hrefOf).
const SECTION = {
  about: 'esittely',
  projects: 'projektit',
  cv: 'cv',
  contact: 'yhteys',
};

// Ohjausmerkit (rivinvaihdot, nollamerkki) ja näkymättömät suuntamerkit, joilla tekstin
// voisi saada näyttämään joltain muulta kuin se on
const isControl = (code) =>
  code < 0x20 ||
  (code >= 0x7f && code <= 0x9f) ||
  (code >= 0x200b && code <= 0x200f) ||
  (code >= 0x2028 && code <= 0x202e) ||
  (code >= 0x2066 && code <= 0x2069);

// Poistaa ohjausmerkit, rajaa pituuden ja siistii välilyönnit. Käytetään sekä näytettävään
// viestiin että tunnistukseen.
export function cleanInput(raw) {
  return Array.from(String(raw ?? '').slice(0, MAX_INPUT), (ch) => (isControl(ch.codePointAt(0)) ? ' ' : ch))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

// Vertailumuoto: pienet kirjaimet, ei välimerkkejä. Ääkköset säilyvät, mutta niille on
// lisäksi ä→a-muoto, jotta "vaino" löytää VäinöAI:n.
function normalize(text) {
  return cleanInput(text)
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^a-z0-9åäö\s-]/g, ' ')
    .replace(/-/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
const plain = (text) => text.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/å/g, 'a');

// Sallii vain sisäiset osoitteet ja https-linkit
export function safeHref(href) {
  if (typeof href !== 'string') return null;
  if (/^\/?#[a-z0-9-]+$/.test(href) || /^\/[a-z0-9/-]*$/.test(href)) return href;
  try {
    const url = new URL(href);
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

// Aiheet ja niiden avainsanat (sanan alkuja: "projekt" löytää "projektit" ja "projekteista").
// Järjestys ratkaisee tasapelin: tarkempi aihe ensin.
const TOPICS = [
  { id: 'bot', words: ['botti', 'botit', 'kuka sinä', 'kuka sä', 'mikä sinä', 'mikä sä', 'tekoäly', 'ai botti', 'chatbot'] },
  { id: 'privacy', words: ['tietosuoj', 'eväst', 'seuran', 'yksityis', 'tallenn', 'gdpr', 'analytiik'] },
  { id: 'site', words: ['tämä sivu', 'tämän sivun', 'sivusto', 'sivu tehty', 'millä tehty', 'miten tehty', 'tehty sivu', 'vite', 'tekniikka sivu'] },
  { id: 'wip', words: ['työn alla', 'kesken', 'tekeillä', 'tulossa', 'työnalla', 'teossa'] },
  { id: 'games', words: ['peli', 'pelej', 'pelaa', 'pelialue', 'zrunner', 'spacedriver', 'shadowbuilder', 'phaser'] },
  { id: 'certs', words: ['sertifik', 'serti', 'kurssi', 'kurssej', 'freecodecamp', 'credly', 'todistu'] },
  { id: 'education', words: ['koulut', 'tutkin', 'opisk', 'opinn', 'koulu', 'taitotalo', 'valmistu'] },
  { id: 'work', words: ['työkokem', 'työhistor', 'kokemus', 'työpaik', 'työskennel', 'automekaan', 'mekaanik', 'autoal', 'vartija', 'turvallisuus', 'työssäopp', 'harjoitt', 'aiemmin', 'ura'] },
  { id: 'job', words: ['työtarjo', 'palkat', 'palkkaa', 'rekry', 'vapaana', 'saatavilla', 'etsii töitä', 'etsiikö', 'hakee töitä', 'töihin', 'työhön', 'avoin', 'aloittaa', 'tarjota töitä', 'työpaikkaa'] },
  { id: 'contact', words: ['yhtey', 'yhteys', 'viesti', 'sähköpost', 'email', 'meili', 'puhelin', 'numero', 'soita', 'linkedin', 'github', 'instagram', 'facebook', 'some', 'tavoitt', 'lomake'] },
  { id: 'cv', words: ['cv', 'ansioluett', 'videocv', 'video cv', 'tulost', 'pdf'] },
  { id: 'languages', words: ['kielitai', 'puhuu', 'englant', 'suomen kiel', 'kielet', 'kieliä'] },
  { id: 'skills', words: ['osaa', 'osaamin', 'taito', 'taitaa', 'tekniik', 'teknolog', 'ohjelmointikiel', 'stack', 'työkalu', 'react', 'node', 'javascript', 'html', 'css', 'mysql', 'robot framework', 'wordpress', 'frontend', 'backend', 'fullstack'] },
  { id: 'projects', words: ['projekt', 'sovellu', 'portfolio', 'tehnyt', 'tehdyt', 'töitä', 'näyt', 'demo', 'traileri', 'appi', 'äpp'] },
  { id: 'hobbies', words: ['harrast', 'vapaaaj', 'koira', 'kamppailu', 'judo', 'valokuv', 'videokuv', 'musiik', 'elokuv', 'retkeil', 'liikun'] },
  { id: 'location', words: ['missä', 'asuu', 'sijain', 'kerava', 'paikkakun', 'kaupunki', 'etätyö', 'etänä'] },
  { id: 'about', words: ['kuka', 'kerro jari', 'kerro itse', 'esittel', 'tausta', 'jari karri', 'kuka on'] },
  { id: 'thanks', words: ['kiitos', 'kiitti', 'kiitoksia', 'thanks'] },
  { id: 'bye', words: ['heippa', 'moikka', 'näkemiin', 'hei hei', 'nähdään', 'bye'] },
  { id: 'greet', words: ['hei', 'moi', 'terve', 'huomenta', 'päivää', 'iltaa', 'hello', 'morjens', 'moro'] },
];

// Tunnistettavat projekti- ja pelinimet (vertailumuodossa)
const PROJECT_KEYS = PROJECTS.map((p) => ({ item: p, keys: keysFor(p.name) }));
const GAME_KEYS = GAMES.map((g) => ({ item: g, keys: keysFor(g.name) }));

function keysFor(name) {
  const n = normalize(name);
  const first = n.split(' ')[0];
  const keys = new Set([n, n.replace(/ /g, ''), plain(n), plain(n).replace(/ /g, '')]);
  // Yksilöivä ensimmäinen sana riittää ("watcher", "reapers"), lyhyet sanat eivät ("ai")
  if (first.length >= 5) keys.add(first).add(plain(first));
  return [...keys];
}

// Sana tai sanan alku löytyy tekstistä
function hasWord(text, word) {
  if (word.includes(' ')) return text.includes(word);
  return text.split(' ').some((w) => w.startsWith(word));
}

function findTopic(text) {
  const forms = [text, plain(text)];
  let best = null;
  let bestScore = 0;
  for (const topic of TOPICS) {
    const score = topic.words.filter((w) => forms.some((f) => hasWord(f, w) || hasWord(f, plain(w)))).length;
    if (score > bestScore) {
      best = topic.id;
      bestScore = score;
    }
  }
  return best;
}

// Nimi löytyy tekstistä kokonaan, tai kävijä kirjoitti nimen alun ("vaino", "kilsa").
// Alun pitää olla vähintään viisi merkkiä, ettei esim. "judo" vie Judovisaan.
function findNamed(list, text) {
  const forms = [text, text.replace(/ /g, ''), plain(text), plain(text).replace(/ /g, '')];
  const starts = [...text.split(' '), ...plain(text).split(' ')].filter((w) => w.length >= 5);
  return (
    list.find(({ keys }) => keys.some((k) => forms.some((f) => f.includes(k))))?.item ??
    list.find(({ keys }) => keys.some((k) => starts.some((w) => k.startsWith(w))))?.item ??
    null
  );
}

// Tekniikkasuodatin: "react-projektit", "php"
// label: partitiivi lauseeseen "Projektit, joissa on käytetty …"
const TECHS = [
  { key: 'react', label: 'Reactia', match: (p) => p.tech.includes('React') },
  { key: 'node', label: 'Node.js:ää', match: (p) => p.tech.includes('Node.js') },
  { key: 'openai', label: 'OpenAI:ta', match: (p) => p.tech.includes('OpenAI') },
  { key: 'tekoäly', label: 'tekoälyä', match: (p) => p.tech.includes('OpenAI') },
  { key: 'php', label: 'PHP:tä', match: (p) => p.tech.includes('PHP') },
  { key: 'mysql', label: 'MySQL:ää', match: (p) => p.tech.includes('MySQL') },
  { key: 'mongo', label: 'MongoDB:tä', match: (p) => p.tech.some((t) => t.startsWith('MongoDB') || t === 'MERN') },
  { key: 'firebase', label: 'Firebasea', match: (p) => p.tech.includes('Firebase') },
];

// Listaa nimet luontevasti: "A, B ja C"
const list = (items) =>
  items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} ja ${items.at(-1)}`;

const projectLink = (p) => {
  const action = projectAction(p);
  return { label: `${action.label}: ${p.name}`, href: p.url, external: true };
};

// Vastaus = { text, links: [{ label, href, external }], chips: [aihe-id] }
function answerProject(p) {
  const wip = p.status === 'wip' ? ' Projekti on vielä työn alla.' : '';
  return {
    text: `${p.name}: ${p.desc} (${p.tech.join(', ')})${wip}`,
    links: [projectLink(p), { label: 'Kaikki projektit', section: SECTION.projects }],
    chips: ['projects', 'skills'],
  };
}

function answerGame(g) {
  return {
    text: `${g.name} (${g.genre.toLowerCase()}): ${g.description} Pelaa suoraan selaimessa, myös puhelimella.`,
    links: [{ label: 'Pelialueelle', page: 'pelit' }],
    chips: ['games', 'projects'],
  };
}

function answerTech(tech) {
  const found = PROJECTS.filter(tech.match);
  if (!found.length) return null;
  return {
    text: `Projektit, joissa on käytetty ${tech.label}: ${list(found.map((p) => p.name))}.`,
    links: [{ label: 'Näytä projektit', section: SECTION.projects }],
    chips: ['skills', 'projects'],
  };
}

const ANSWERS = {
  greet: () => ({ text: 'Hei vaan! Mitä haluaisit tietää Jarista?', chips: START_CHIPS }),

  bot: () => ({
    text: 'Olen Jari-Bot, portfolion opas. En ole tekoäly enkä Jari itse: vastaan sivun tietojen perusteella, enkä tallenna enkä lähetä viestejäsi minnekään. Jarille itselleen saat viestin yhteydenottolomakkeella.',
    links: [{ label: 'Ota yhteyttä', section: SECTION.contact }],
    chips: START_CHIPS,
  }),

  about: () => ({
    text: `${profile.name} on ${profile.role.toLowerCase()} ${profile.location}lta. Hän on suuntautunut erityisesti web-kehitykseen ja ohjelmistojen suunnitteluun, ja häntä kiinnostavat käyttöliittymät, web-sovellukset ja uusien teknologioiden oppiminen.`,
    links: [{ label: 'Lue esittely', section: SECTION.about }],
    chips: ['skills', 'projects', 'hobbies'],
  }),

  skills: () => ({
    // Kirjoitettu käsin sujuvaksi kokonaisuudeksi (CV:n taitolista on cv.js:ssä).
    // \n\n jakaa kappaleisiin (JariBotChat.css: white-space: pre-line).
     text: 'Jari tekee web-sovelluksia sekä käyttöliittymän että palvelimen puolella. Käyttöliittymät syntyvät HTML:llä ja CSS:llä sekä Reactilla tai Vanilla JavaScriptillä, ja palvelinpuolella hän käyttää Node.js:ää ja REST API -rajapintoja. Tietokannoista tuttuja ovat MySQL ja MongoDB Atlas, ja sivustoja on syntynyt myös WordPressillä. Projekteissa on hyödynnetty lisäksi PHP:tä, Firebasea, OpenAI:n rajapintaa ja Phaser-pelimoottoria.\n\nTestaukseen Jari käyttää Robot Frameworkia, hakukoneoptimointiin Screaming Frog SEO Spideria ja tietoturvaskannaukseen OWASP ZAPia. Suunnitteluun hän käyttää Figmaa ja draw.io:ta, grafiikkaan Adobe Photoshopia ja Illustratoria, ja projektien trailerit on editoitu Adobe Premiere Prolla.\n\nOhjelmoinnin apuna Jari käyttää tekoälytyökaluja: ChatGPT, Claude, Codex, Claude Code ja GitHub Copilot. Lisäksi hän tuntee tietoliikenteen perusteet ja verkon aktiivilaitteet.',
    links: [{ label: 'Näytä CV', section: SECTION.cv }],
    chips: ['projects', 'certs', 'languages'],
  }),

  languages: () => ({
    text: `Kielitaito: ${list(languages.map((l) => l.toLowerCase()))}.`,
    chips: ['skills', 'cv'],
  }),

  projects: () => {
    const done = PROJECTS.filter((p) => p.status !== 'wip');
    const wip = PROJECTS.filter((p) => p.status === 'wip');
    return {
      text: `Portfoliossa on ${PROJECTS.length} projektia: ${list(done.map((p) => p.name))}. Työn alla: ${list(wip.map((p) => p.name))}. Kysy mistä tahansa nimellä, niin kerron lisää.`,
      links: [{ label: 'Näytä projektit', section: SECTION.projects }],
      chips: ['wip', 'games', 'skills'],
    };
  },

  wip: () => {
    const wip = PROJECTS.filter((p) => p.status === 'wip');
    return {
      text: `Työn alla: ${wip.map((p) => `${p.name} (${p.desc.replace(/\.$/, '').toLowerCase()})`).join(', ')}.`,
      links: [{ label: 'Näytä projektit', section: SECTION.projects }],
      chips: ['projects', 'games'],
    };
  },

  games: () => ({
    text: `Pelialueella on ${GAMES.length} selainpeliä: ${GAMES.map((g) => `${g.name} (${g.genre.toLowerCase()})`).join(', ')}. Ne toimivat suoraan selaimessa, myös puhelimella.`,
    links: [{ label: 'Pelialueelle', page: 'pelit' }],
    chips: ['projects', 'skills'],
  }),

  work: () => ({
    text: `Työkokemus: ${work.map((w) => `${w.title} (${w.time})`).join(', ')}.`,
    links: [{ label: 'Näytä CV', section: SECTION.cv }],
    chips: ['education', 'skills', 'job'],
  }),

  education: () => {
    const shown = education.filter((e) => e.cv !== false);
    return {
      text: `Koulutus: ${shown.map((e) => `${e.title}, ${e.text.toLowerCase()} (${e.time})`).join('; ')}.`,
      links: [{ label: 'Näytä CV', section: SECTION.cv }],
      chips: ['certs', 'work'],
    };
  },

  certs: () => ({
    text: `Sertifikaatit: ${list(certificates.map((c) => c.name))}. Lisäksi kursseja, esimerkiksi ${list(courses.slice(0, 2))}.`,
    links: certificates.map((c) => ({ label: c.name, href: c.url, external: true })),
    chips: ['education', 'skills'],
  }),

  cv: () => ({
    text: 'CV-osiossa on koko CV yhdellä sivulla (tulostettavissa PDF:ksi), video-CV, työkokemus, koulutus ja sertifikaatit.',
    links: [{ label: 'Avaa CV-osio', section: SECTION.cv }],
    chips: ['work', 'education', 'certs'],
  }),

  hobbies: () => ({
    text: `Vapaa-ajalla Jari ulkoilee koiransa kanssa, liikkuu ja retkeilee luonnossa. Harrastuksiin kuuluvat myös ${hobbies.split(',')[0].toLowerCase()}, valo- ja videokuvaus, elokuvat ja musiikki.`,
    links: [{ label: 'Lue esittely', section: SECTION.about }],
    chips: ['about', 'skills'],
  }),

  location: () => ({
    text: `Jari asuu ${profile.location}lla. Kysy työn sijainnista ja etätyöstä suoraan yhteydenottolomakkeella.`,
    links: [{ label: 'Ota yhteyttä', section: SECTION.contact }],
    chips: ['job', 'contact'],
  }),

  job: () => ({
    text: `Kyllä: Jari on ${profile.heroStatus.toLowerCase()} ja etsii aktiivisesti web-kehityksen töitä. Laita viesti yhteydenottolomakkeella tai LinkedInissä.`,
    links: [
      { label: 'Ota yhteyttä', section: SECTION.contact },
      ...socials.filter((s) => s.name === 'LinkedIn').map((s) => ({ label: 'LinkedIn', href: s.href, external: true })),
    ],
    chips: ['skills', 'work'],
  }),

  contact: () => ({
    text: 'Jarin tavoittaa parhaiten sivun yhteydenottolomakkeella. Hänet löytää myös somesta:',
    links: [
      { label: 'Yhteydenottolomake', section: SECTION.contact },
      ...socials.filter((s) => s.contact).map((s) => ({ label: s.name, href: s.href, external: true })),
    ],
    chips: ['job', 'privacy'],
  }),

  site: () => ({
    text: 'Jari on tehnyt tämän sivun itse Reactilla ja Vitellä. Animaatiot on tehty CSS:llä ja motion-kirjastolla, taustan partikkelit canvasilla ja pelit Phaser-pelimoottorilla sekä Reactilla ja SVG:llä. Minäkin olen piirretty SVG:llä, ja vastaukseni tulevat samoista tiedoista kuin sivu. Sivulla ei ole evästeitä eikä seurantaa, ja tietoturvaotsakkeet ovat kunnossa.',
    links: [{ label: 'Pelialueelle', page: 'pelit' }],
    chips: ['projects', 'games', 'privacy'],
  }),

  privacy: () => ({
    text: 'Sivustolla ei ole evästeitä, analytiikkaa eikä seurantaa. Minäkään en tallenna enkä lähetä viestejäsi minnekään: keskustelu katoaa, kun suljet sivun. Pelit tallentavat ennätykset vain selaimeesi.',
    chips: START_CHIPS,
  }),

  thanks: () => ({ text: 'Ole hyvä! Kysy lisää, jos jokin jäi mietityttämään.', chips: START_CHIPS }),

  bye: () => ({ text: 'Kiitos käynnistä! Muista, että Jarille saa laittaa viestiä yhteydenottolomakkeella.', links: [{ label: 'Ota yhteyttä', section: SECTION.contact }] }),
};

const FALLBACK = {
  text: 'En ihan ymmärtänyt. Osaan kertoa Jarin osaamisesta, projekteista, peleistä, CV:stä ja yhteystiedoista. Valitse aihe tai kysy toisin sanoin.',
  chips: ['about', 'skills', 'projects', 'games', 'cv', 'contact'],
};

// Pääfunktio: kävijän kysymys → vastaus. Aihenapin painallus antaa suoraan aiheen id:n.
// Aiheen vastaus, johon on merkitty aihe (napeista jätetään pois juuri kysytty)
const answerTopic = (id) => ({ ...ANSWERS[id](), topic: id });

export function reply(input, topicId) {
  if (topicId && ANSWERS[topicId]) return answerTopic(topicId);

  const text = normalize(input);
  if (!text) return FALLBACK;

  // Nimetty projekti tai peli on tarkin vastaus
  const game = findNamed(GAME_KEYS, text);
  if (game) return answerGame(game);
  const project = findNamed(PROJECT_KEYS, text);
  if (project) return answerProject(project);

  const topic = findTopic(text);

  // "React-projektit": tekniikka + projektit-sana
  if (topic === 'projects' || /projekt|sovellu|tehnyt/.test(text)) {
    const tech = TECHS.find((t) => text.split(' ').some((w) => w.startsWith(t.key)));
    if (tech) {
      const answer = answerTech(tech);
      if (answer) return answer;
    }
  }

  return topic ? answerTopic(topic) : FALLBACK;
}