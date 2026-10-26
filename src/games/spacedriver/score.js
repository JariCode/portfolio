// Space Driverin ennätyksen tallennus. Yhteinen aloitusnäkymälle ja loppuruudulle.
// Pisteiden laskenta lisätään, kun viholliset ovat mukana (vaihe 5).
// localStorage-kutsut ovat try/catchissa: selain voi estää tallennuksen (esim. yksityinen selaus).

const SAVE_PREFIX = 'jaricode:spacedriver:';
const RECORD_KEY = `${SAVE_PREFIX}ennatys`;

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