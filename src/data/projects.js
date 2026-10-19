// Uusi projekti = uusi olio listaan.
// tags:   suodattimet ('React' tai 'JS'), tyhjä taulukko = näkyy vain "Kaikki"-suodattimella
// status: 'done' tai 'wip'
// img:    polku public-kansiossa, tyhjä merkkijono → kortti näyttää neonkuvion

export const PROJECTS = [
  { name: 'Watcher AI',        desc: 'Tekoälypohjainen chatsovellus.',                    tech: ['React', 'Node.js', 'OpenAI'],     tags: ['React'], status: 'done', url: 'https://youtu.be/riLghm5ydWo?si=8CQeuqb8dE7TdjCo', img: 'img/watcher-ai.webp' },
  { name: "Reaper's Calendar", desc: 'Kalenterisovellus tehtävien hallintaan.',           tech: ['React', 'MongoDB Atlas'],          tags: ['React'], status: 'done', url: 'https://youtu.be/Ov1q_Gs6aqc?si=QZ5SnAn2_2odQ6JD', img: 'img/reapers_calendar.webp' },
  { name: 'Scary Notes',       desc: 'Muistiinpanosovellus web- ja mobiilikäyttöön.',     tech: ['Web', 'Mobile', 'Firebase'],       tags: ['React'], status: 'done', url: 'https://www.youtube.com/watch?v=B4FVWTENkv8',      img: 'img/scarynotes.webp' },
  { name: 'Palkkiolaskuri',    desc: 'Palkkioiden laskuri oikealle asiakkaalle.',         tech: ['Asiakasprojekti', 'Ryhmätyö'],    tags: ['JS'],    status: 'done', url: 'https://palkkiolaskuri.fi/',                       img: '' },
  { name: 'Zombie TO-DO',      desc: 'Tehtävälista zombie-teemalla ja tietokannalla.',    tech: ['PHP', 'MySQL'],                    tags: [],        status: 'done', url: 'https://youtu.be/7N0jjv_Zsjc?si=vHKVJ7ETIK7EyHBb', img: 'img/zombietodo.webp' },
  { name: 'AI-sivu',           desc: 'Ryhmätyönä toteutettu tekoälyaiheinen sivusto.',    tech: ['Ryhmätyöprojekti', 'JavaScript'], tags: ['JS'],    status: 'done', url: 'https://henkilot.github.io/AI/',                   img: '' },
  { name: 'Judovisa',          desc: 'Judon termistöä testaava visasovellus.',            tech: ['JavaScript', 'Node.js'],           tags: ['JS'],    status: 'done', url: 'https://www.youtube.com/watch?v=b0A5zm8vlyg',      img: 'img/judovisa.webp' },
  { name: 'Ikimetsä',          desc: 'React-pohjainen roolipeli metsämaailmassa.',        tech: ['React', 'Roolipeli'],              tags: ['React'], status: 'wip',  url: 'https://drive.google.com/file/d/19yDpMizZySFxg0jdJ-55eZmp4t_74Plb/view', img: 'img/ikimetsa.webp' },
  { name: 'Kilsamittari',      desc: 'Kävelypäiväkirja matkojen seurantaan.',             tech: ['React', 'MERN'],                   tags: ['React'], status: 'done', url: 'https://youtu.be/zV87zPPu7hQ?si=fntKzL1zCzyU7Jdz', img: 'img/kilsamittari.webp' },
  { name: 'VäinöAI',           desc: 'Keskusteleva tekoälyhahmo.',                        tech: ['React', 'Node.js', 'OpenAI'],     tags: ['React'], status: 'done', url: 'https://youtu.be/jhXInQ_DfRg?si=HWYnyCqndL0sQF1Z', img: 'img/vainoai.webp' },
  { name: 'Nimeoniter',        desc: 'Pelillistetty tehtävienhallintasovellus.',          tech: ['React', 'Node.js', 'OpenAI'],     tags: ['React'], status: 'wip',  url: 'https://youtu.be/Imdgt3M-HI0?si=LDDxJaavs10G2sGU', img: 'img/nimeoniter.webp' },
  { name: 'Kreniter Mind',     desc: 'Projektien, tehtävien ja muistiinpanojen työtila.', tech: ['React', 'Node.js', 'OpenAI'],     tags: ['React'], status: 'wip',  url: 'https://youtu.be/Q8WitiBMVgw?si=qgQhBrtHrA1xFotg', img: 'img/kreniter-mind.webp' },
];

// Suodatinnapit: id vertautuu tags-kenttään, paitsi 'all' ja 'wip'
export const FILTERS = [
  { id: 'all',   label: 'Kaikki' },
  { id: 'React', label: 'React' },
  { id: 'JS',    label: 'Vanilla JS' },
  { id: 'wip',   label: 'Työn alla' },
];

// Palauttaa true, jos projekti kuuluu valittuun suodattimeen
export function matchesFilter(project, filter) {
  if (filter === 'all') return true;
  if (filter === 'wip') return project.status === 'wip';
  return project.tags.includes(filter);
}

// Poimii YouTube-videon tunnisteen osoitteesta (youtu.be/ID tai youtube.com/watch?v=ID)
export function youtubeId(url) {
  const match = url.match(/(?:youtu\.be\/|[?&]v=)([\w-]{11})/);
  return match ? match[1] : null;
}

// Mitä projektin päänappi tekee: avaa trailerin sivulla tai linkin uuteen välilehteen
export function projectAction(project) {
  const videoId = youtubeId(project.url);
  if (videoId) return { kind: 'video', videoId, label: 'Katso traileri' };
  if (/drive\.google/.test(project.url)) return { kind: 'link', label: 'Katso esittely' };
  return { kind: 'link', label: 'Avaa sivusto' };
}