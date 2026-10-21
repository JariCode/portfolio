// Energiapakkaukset: palauttavat yhden energian. Kuva piirretään koodilla (neonakku plus-merkillä).
// Paikat tulevat Tiledin Objektit-tasolta (pisteet nimellä "energia"); jos niitä ei ole,
// käytetään oletussarakkeita. Pakkaus jää paikalleen, jos energia on jo täynnä.

const PACK_KEY = 'zr-energy';
const W = 40;
const H = 48;

// Oletussarakkeet: kentän ensimmäisen, toisen ja viimeisen kolmanneksen alussa.
// Valopallot ovat joka kolmannessa sarakkeessa (4, 7, 10…), joten nämä eivät osu samaan kohtaan.
const DEFAULT_COLUMNS = [35, 68, 101];

function drawPack(scene) {
  if (scene.textures.exists(PACK_KEY)) return;
  const tex = scene.textures.createCanvas(PACK_KEY, W, H);
  const ctx = tex.getContext();
  const magenta = getComputedStyle(document.documentElement).getPropertyValue('--magenta').trim() || '#ff3dc8';

  // Hehku piirretään canvasin varjolla, jolloin erillistä sumennusta ei tarvita
  ctx.shadowColor = magenta;
  ctx.shadowBlur = 8;
  ctx.strokeStyle = magenta;
  ctx.fillStyle = 'rgba(9, 6, 22, 0.85)';
  ctx.lineWidth = 3;

  // Akun runko ja napa
  ctx.beginPath();
  ctx.roundRect(8, 12, W - 16, H - 20, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = magenta;
  ctx.fillRect(W / 2 - 5, 6, 10, 5);

  // Plus-merkki
  ctx.fillRect(W / 2 - 2.5, 20, 5, 18);
  ctx.fillRect(W / 2 - 9, 26.5, 18, 5);
  tex.refresh();
}

// Sarakkeen ylin kiinteä laatta; pakkaus asetetaan sen päälle. Kuopan kohdalla siirrytään
// seuraavaan sarakkeeseen, jottei pakkaus leiju tavoittamattomissa.
function surfacePosition(ground, back, col) {
  const T = ground.tilemap.tileWidth;
  for (let c = col; c < col + 6; c++) {
    for (let row = 0; row < ground.tilemap.height; row++) {
      const t = ground.getTileAt(c, row) ?? back.getTileAt(c, row);
      if (t?.collides) return { x: c * T + T / 2, y: row * T - H / 2 - 4 };
    }
  }
  return null;
}

export function createEnergyPacks(scene, objects) {
  drawPack(scene);
  const placed = objects.filter((o) => o.name === 'energia').map((o) => ({ x: o.x, y: o.y }));
  const positions = placed.length
    ? placed
    : DEFAULT_COLUMNS.map((col) => surfacePosition(scene.ground, scene.back, col)).filter(Boolean);

  const group = scene.physics.add.staticGroup();
  positions.forEach((pos, i) => {
    const pack = group.create(pos.x, pos.y, PACK_KEY);
    pack.setDepth(3);
    // Sykkii, jotta erottuu valopalloista ja kiinnittää huomion
    scene.tweens.add({ targets: pack, scale: 1.12, duration: 520 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  });
  return group;
}

export function collectPack(scene, pack) {
  pack.body.enable = false;
  scene.tweens.killTweensOf(pack);
  scene.tweens.add({
    targets: pack,
    y: pack.y - 50,
    scale: 1.6,
    alpha: 0,
    duration: 350,
    ease: 'Quad.out',
    onComplete: () => pack.destroy(),
  });
}