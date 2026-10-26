// Space Driverin äänet Web Audio API:lla (sama rakenne kuin Z-Runnerissa). Sama moduuli
// palvelee Reactia (alkuanimaatio, välianimaatiot) ja Phaseria (sektorit), joten musiikki
// jatkuu saumatta vaiheesta toiseen. Tiedostot ovat public/audio/spacedriver/ -kansiossa
// (eivät repossa; tekijät credits.js:ssä). Puuttuva tiedosto ei kaada peliä: ääni jää soimatta.
//
// Selaimet sallivat äänen vasta käyttäjän toiminnon jälkeen: unlock() kutsutaan
// Aloita peli -napin painalluksesta. Mykistys on muistissa vain sivun auki ollessa
// (ei tallenneta selaimeen, joten tietosuojaselosteeseen ei tule uutta tallennusta).

const BASE = '/audio/spacedriver/';

export const SOUNDS = {
  shot: 'ammus.mp3',
  hit: 'osuma.mp3',
  // Osuma viholliseen: toistaiseksi sama tiedosto kuin oma osuma, mutta oma nimi pitää
  // karsinnan (gap) erillään, ettei oma osuma jää kuulumatta. Voi vaihtaa omaan tiedostoon.
  enemyHit: 'osuma.mp3',
  enemyShot: 'vihollisen-ammus.mp3',
  explosion: 'rajahdys.mp3',
  bomb: 'pommi.mp3',
  pickup: 'tehostin.mp3',
  hyperjump: 'hyperhyppy.mp3',
  music: 'musiikki.mp3',
  boss: 'pomo.mp3',
  intro: 'intro.mp3',
};

// Äänenvoimakkuudet: musiikki taustalla, efektit selvästi sen päällä
const MUSIC_VOLUME = 0.35;
const SFX_VOLUME = 0.7;

// Eri lähteistä ladatut tiedostot on tallennettu hyvin eri voimakkuuksilla. Siksi jokainen
// tiedosto tasataan latauksessa samaan keskimääräiseen voimakkuuteen (RMS), ja vasta sen
// päälle tulevat pelin omat voimakkuudet (play ja playMusic). Vahvistus rajataan niin,
// ettei äänen huippu ylitä täyttä tasoa (säröä), eikä hiljaista ääntä nosteta loputtomasti.
const TARGET_RMS = 0.12;
const MAX_BOOST = 4;
const MIN_BOOST = 0.25;
// Hiljaisuutta ei lasketa keskiarvoon: lyhyen efektin perässä oleva tyhjä häntä
// saisi äänen näyttämään hiljaisemmalta kuin se on
const SILENCE = 0.01;

let ctx = null;
let master = null;
let muted = false;
const buffers = new Map(); // nimi → AudioBuffer tai lataus käynnissä (Promise)
const levels = new Map(); // nimi → tasauskerroin (normalize)
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

// Tasauskerroin: kuinka paljon tiedostoa vahvistetaan tai vaimennetaan, jotta sen
// voimakkuus on TARGET_RMS. Näyte joka 8. arvosta riittää ja pitää laskennan nopeana.
function normalize(buffer) {
  let sum = 0;
  let count = 0;
  let peak = 0;
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < data.length; i += 8) {
      const v = Math.abs(data[i]);
      if (v > peak) peak = v;
      if (v < SILENCE) continue;
      sum += v * v;
      count += 1;
    }
  }
  if (!count || !peak) return 1;
  const rms = Math.sqrt(sum / count);
  const gain = Math.min(TARGET_RMS / rms, 1 / peak, MAX_BOOST);
  return Math.max(gain, MIN_BOOST);
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
      levels.set(name, normalize(buffer));
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
// gap: sama ääni soi enintään kerran näin monessa sekunnissa (esim. monta räjähdystä samalla hetkellä).
// Palauttaa funktion, joka hiljentää äänen kesken (esim. lopputekstien ohitus), tai undefined,
// jos ääni ei soinut.
export function play(name, { volume = SFX_VOLUME, rate = 1, duration, gap = 0.08 } = {}) {
  const buffer = buffers.get(name);
  if (!ctx || !(buffer instanceof AudioBuffer)) return;
  if (ctx.currentTime - (lastPlayed.get(name) ?? -Infinity) < gap) return;
  lastPlayed.set(name, ctx.currentTime);
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const level = volume * (levels.get(name) ?? 1);
  gain.gain.value = level;
  source.connect(gain).connect(master);
  const now = ctx.currentTime;
  source.start(now);
  if (duration) {
    gain.gain.setValueAtTime(level, now + duration - 0.4);
    gain.gain.linearRampToValueAtTime(0, now + duration);
    source.stop(now + duration);
  }
  return (fade = 0.4) => {
    const t = ctx.currentTime;
    gain.gain.cancelScheduledValues(t);
    gain.gain.setValueAtTime(gain.gain.value, t);
    gain.gain.linearRampToValueAtTime(0, t + fade);
    try {
      source.stop(t + fade);
    } catch {
      // Ääni oli jo loppunut
    }
  };
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
  gain.gain.linearRampToValueAtTime(MUSIC_VOLUME * (levels.get(name) ?? 1), ctx.currentTime + fadeIn);
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