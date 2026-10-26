// Z-Runnerin pisteet sekä ennätyksen ja jatkokohdan tallennus. Yhteinen aloitusnäkymälle ja
// pelikentälle.
// localStorage-kutsut ovat try/catchissa: selain voi estää tallennuksen (esim. yksityinen selaus).

const SAVE_PREFIX = 'jaricode:zrunner:';
const RECORD_KEY = `${SAVE_PREFIX}ennatys`;
const RESUME_KEY = `${SAVE_PREFIX}jatko`;

// Pisteytys: valopallo 10, zombi 50 ja aikabonus 5 pistettä jokaisesta sekunnista,
// joka jää alle aikarajan (kolme minuuttia jokaista pelattua maailmaa kohti).
// Nopea, mutta kaiken keräävä ja zombit kaatava voittaa.
const ORB_POINTS = 10;
const KILL_POINTS = 50;
const TIME_LIMIT_S = 180;
const TIME_POINTS = 5;

// Aika muodossa 1:23.4
export function formatTime(ms) {
  const total = Math.floor(ms / 100);
  const min = Math.floor(total / 600);
  const sec = Math.floor((total % 600) / 10);
  return `${min}:${String(sec).padStart(2, '0')}.${total % 10}`;
}

export function calcScore({ orbs, kills, time, worlds = 1 }) {
  const timeBonus = Math.max(0, Math.round((TIME_LIMIT_S * worlds - time / 1000) * TIME_POINTS));
  return { orbPoints: orbs * ORB_POINTS, killPoints: kills * KILL_POINTS, timeBonus, total: orbs * ORB_POINTS + kills * KILL_POINTS + timeBonus };
}

export function readRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(RECORD_KEY));
    return typeof record?.score === 'number' ? record : null;
  } catch {
    return null;
  }
}

// Tallennetaan vain, jos tulos on parempi kuin aiempi. Palauttaa true, jos ennätys parani.
export function saveRecord(result) {
  const old = readRecord();
  if (old && old.score >= result.score) return false;
  try {
    localStorage.setItem(RECORD_KEY, JSON.stringify(result));
    return true;
  } catch {
    return false;
  }
}

// Jatkokohta: { world, carry } eli maailman alku, josta keskeneräistä peliä voi jatkaa
// myöhemmin (sama kohta, josta kaatuessa yritetään uudelleen). Tallennetaan, kun ensimmäinen
// maailma on läpäisty, ja poistetaan, kun peli on pelattu loppuun tai aloitetaan alusta.
// Väärän muotoinen tallennus ohitetaan: Game.jsx tarkistaa vielä, että maailma on olemassa.
export function readResume() {
  try {
    const resume = JSON.parse(localStorage.getItem(RESUME_KEY));
    const { world, carry } = resume ?? {};
    const valid = Number.isInteger(world) && world > 0 && carry && Object.values(carry).every(Number.isFinite);
    return valid ? resume : null;
  } catch {
    return null;
  }
}

export function saveResume(start) {
  try {
    localStorage.setItem(RESUME_KEY, JSON.stringify(start));
  } catch {
    // Tallennus estetty: jatkaminen ei vain ole mahdollista
  }
}

export function clearResume() {
  try {
    localStorage.removeItem(RESUME_KEY);
  } catch {
    // Tallennus estetty: ei mitään poistettavaa
  }
}

// Tyhjennä tallennukset: poistaa vain tämän pelin avaimet, muiden pelien tallennukset jäävät
export function clearSaves() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(SAVE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Tallennus estetty: ei mitään poistettavaa
  }
}