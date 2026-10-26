// Space Driverin ennätyksen ja jatkokohdan tallennus. Yhteinen aloitusnäkymälle ja pelikentälle.
// localStorage-kutsut ovat try/catchissa: selain voi estää tallennuksen (esim. yksityinen selaus).

const SAVE_PREFIX = 'jaricode:spacedriver:';
const RECORD_KEY = `${SAVE_PREFIX}ennatys`;
const RESUME_KEY = `${SAVE_PREFIX}jatko`;

// Ennätys: { score, sector, kills }. Väärän muotoinen tallennus ohitetaan.
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

// Jatkokohta: { sector, carry } eli sektorin alku, josta keskeneräistä peliä voi jatkaa
// myöhemmin (sama kohta, josta kaatuessa yritetään uudelleen). Tallennetaan, kun ensimmäinen
// sektori on läpäisty, ja poistetaan, kun peli on pelattu loppuun tai aloitetaan alusta.
// Väärän muotoinen tallennus ohitetaan: Game.jsx tarkistaa vielä, että sektori on olemassa.
export function readResume() {
  try {
    const resume = JSON.parse(localStorage.getItem(RESUME_KEY));
    const { sector, carry } = resume ?? {};
    const valid = Number.isInteger(sector) && sector > 0 && carry && Object.values(carry).every(Number.isFinite);
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