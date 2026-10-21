// Z-Runnerin pisteet ja ennätyksen tallennus. Yhteinen aloitusnäkymälle ja maaliruudulle.
// localStorage-kutsut ovat try/catchissa: selain voi estää tallennuksen (esim. yksityinen selaus).

const SAVE_PREFIX = 'jaricode:zrunner:';
const RECORD_KEY = `${SAVE_PREFIX}ennatys`;

// Pisteytys: valopallo 10, zombi 50 ja aikabonus 5 pistettä jokaisesta sekunnista,
// joka jää alle kolmen minuutin. Nopea, mutta kaiken keräävä ja zombit kaatava voittaa.
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

export function calcScore({ orbs, kills, time }) {
  const timeBonus = Math.max(0, Math.round((TIME_LIMIT_S - time / 1000) * TIME_POINTS));
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