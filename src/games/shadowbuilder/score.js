// Shadow Builderin tallennukset. Yhteinen aloitusnäkymälle ja pelikentälle.
// localStorage-kutsut ovat try/catchissa: selain voi estää tallennuksen (esim. yksityinen selaus).
// Keskeneräinen kaupunki (jaricode:shadowbuilder:kaupunki) lisätään vaiheessa 5.

const SAVE_PREFIX = 'jaricode:shadowbuilder:';
const RECORD_KEY = `${SAVE_PREFIX}ennatys`;

// Ennätys: { days } eli vähiten päiviä 1000 asukkaaseen. Väärän muotoinen tallennus ohitetaan.
export function readRecord() {
  try {
    const record = JSON.parse(localStorage.getItem(RECORD_KEY));
    return Number.isInteger(record?.days) && record.days > 0 ? record : null;
  } catch {
    return null;
  }
}

// Tallennetaan vain, jos päiviä kului vähemmän kuin aiemmin. Palauttaa true, jos ennätys parani.
export function saveRecord(result) {
  const old = readRecord();
  if (old && old.days <= result.days) return false;
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