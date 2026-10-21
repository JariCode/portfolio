// Z-Runnerin äänet Web Audio API:lla. Sama moduuli palvelee Reactia (alkuanimaatio,
// välianimaatio) ja Phaseria (pelikenttä), joten musiikki jatkuu saumatta vaiheesta toiseen.
// Tiedostot ovat public/audio/zrunner/ -kansiossa (eivät repossa; tekijät credits.js:ssä).
//
// Selaimet sallivat äänen vasta käyttäjän toiminnon jälkeen: unlock() kutsutaan
// Aloita peli -napin painalluksesta. Mykistys on muistissa vain sivun auki ollessa
// (ei tallenneta selaimeen, joten tietosuojaselosteeseen ei tule uutta tallennusta).

const BASE = '/audio/zrunner/';

export const SOUNDS = {
  punch: 'lyonti.mp3',
  hurt: 'osuma.mp3',
  zombieDie: 'zombi-kuolee.mp3',
  zombieHit: 'zombi-osuma.mp3',
  zombieAttack: 'zombi-hyokkaa.mp3',
  collect: 'keraa.mp3',
  train: 'juna.mp3',
  music: 'musiikki.mp3',
  intro: 'intro.mp3',
};

// Äänenvoimakkuudet: musiikki taustalla, efektit selvästi sen päällä
const MUSIC_VOLUME = 0.35;
const SFX_VOLUME = 0.7;

let ctx = null;
let master = null;
let muted = false;
const buffers = new Map(); // nimi → AudioBuffer tai lataus käynnissä (Promise)
let music = null; // { name, source, gain }
let wanted = null; // viimeksi pyydetty kappale: lataus voi valmistua vasta, kun on jo pyydetty toista
const lastPlayed = new Map(); // nimi → ctx.currentTime, samanaikaisten toistojen karsintaan
const listeners = new Set();

function context() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
  }
  return ctx;
}

// Lataa ja purkaa äänitiedoston kerran. Puuttuva tiedosto ei kaada peliä: ääni jää vain soimatta.
function load(name) {
  if (buffers.has(name)) return buffers.get(name);
  const c = context();
  if (!c) return Promise.resolve(null);
  const promise = fetch(BASE + SOUNDS[name])
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(res.status))))
    .then((data) => c.decodeAudioData(data))
    .then((buffer) => {
      buffers.set(name, buffer);
      return buffer;
    })
    .catch(() => {
      buffers.set(name, null);
      return null;
    });
  buffers.set(name, promise);
  return promise;
}

// Kutsutaan käyttäjän painalluksesta: avaa äänen ja aloittaa kaikkien äänten latauksen
export function unlock() {
  const c = context();
  if (!c) return;
  if (c.state === 'suspended') c.resume();
  Object.keys(SOUNDS).forEach(load);
}

// Efekti. rate: toistonopeus (ja sävelkorkeus), jotta sama ääni voi kuulostaa vähän eri
// tavalla; duration: soitetaan vain alusta näin monta sekuntia ja häivytetään loppu.
// gap: sama ääni soi enintään kerran näin monessa sekunnissa (esim. juna kaataa monta zombia kerralla).
export function play(name, { volume = SFX_VOLUME, rate = 1, duration, gap = 0.08 } = {}) {
  const buffer = buffers.get(name);
  if (!ctx || !(buffer instanceof AudioBuffer)) return;
  if (ctx.currentTime - (lastPlayed.get(name) ?? -Infinity) < gap) return;
  lastPlayed.set(name, ctx.currentTime);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.value = volume;
  source.connect(gain).connect(master);
  const now = ctx.currentTime;
  source.start(now);
  if (duration) {
    gain.gain.setValueAtTime(volume, now + duration - 0.4);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    source.stop(now + duration);
  }
}

// Taustamusiikki: vaihtaa kappaleen pehmeästi. Sama kappale jatkuu katkeamatta.
export async function playMusic(name, { loop = true, fadeIn = 1 } = {}) {
  if (!ctx || wanted === name) return;
  stopMusic(0.6);
  wanted = name;
  const buffer = await load(name);
  if (!buffer || wanted !== name) return;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.loop = loop;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(MUSIC_VOLUME, ctx.currentTime + fadeIn);
  source.connect(gain).connect(master);
  // Kertasoitto (intro) loppuu itsestään: sama kappale voidaan soittaa myöhemmin uudelleen
  source.onended = () => {
    if (music?.source !== source) return;
    music = null;
    wanted = null;
  };
  source.start();
  music = { name, source, gain };
}

export function stopMusic(fade = 0.8) {
  wanted = null;
  if (!ctx || !music) return;
  const { source, gain } = music;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  gain.gain.linearRampToValueAtTime(0, now + fade);
  source.stop(now + fade + 0.05);
  music = null;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.05);
  listeners.forEach((fn) => fn(muted));
}

// Mykistysnappi kuuntelee muutoksia, jotta näppäin M ja nappi pysyvät samassa tilassa
export function onMuteChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}