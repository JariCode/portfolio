// Valopallot: kerättävät hehkuvat pallot. Kuva piirretään koodilla, ei kuvatiedostoa.
// Paikat tulevat Tiledin Objektit-tasolta (pisteet nimellä "valopallo"); jos niitä ei ole,
// pallot jaetaan kartalle automaattisesti: katoille, tasoille ja kuoppien ylle kaariksi.

const ORB_KEY = 'zr-orb';
const SIZE = 44;

function drawOrb(scene) {
  if (scene.textures.exists(ORB_KEY)) return;
  const tex = scene.textures.createCanvas(ORB_KEY, SIZE, SIZE);
  const ctx = tex.getContext();
  const r = SIZE / 2;
  const glow = ctx.createRadialGradient(r, r, 0, r, r, r);
  glow.addColorStop(0, 'rgba(255, 255, 255, 1)');
  glow.addColorStop(0.25, 'rgba(160, 245, 255, 1)');
  glow.addColorStop(0.45, 'rgba(41, 224, 255, 0.7)');
  glow.addColorStop(1, 'rgba(41, 224, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, SIZE, SIZE);
  tex.refresh();
}

// Automaattinen sijoittelu: joka kolmas sarake. Pallo tulee sarakkeen ylimmän
// kiinteän laatan päälle; kuopan kohdalla se leijuu hypyn korkeudella.
// startRow: ylin rivi, jolta pintaa etsitään (metrossa korkeat katokset ohitetaan)
function autoPositions(ground, back, startRow) {
  const out = [];
  const T = ground.tilemap.tileWidth;
  const rows = ground.tilemap.height;
  for (let col = 4; col < ground.tilemap.width - 4; col += 3) {
    let surface = -1;
    for (let row = startRow; row < rows; row++) {
      const t = ground.getTileAt(col, row) ?? back.getTileAt(col, row);
      if (t?.collides) {
        surface = row;
        break;
      }
    }
    const x = col * T + T / 2;
    if (surface === -1) out.push({ x, y: (rows - 2) * T - 160 }); // kuoppa: hypyn kaaren huippu
    else out.push({ x, y: surface * T - 44 });
  }
  return out;
}

export function createOrbs(scene, objects, startRow = 0) {
  drawOrb(scene);
  const placed = objects.filter((o) => o.name === 'valopallo').map((o) => ({ x: o.x, y: o.y }));
  const positions = placed.length ? placed : autoPositions(scene.ground, scene.back, startRow);

  const group = scene.physics.add.staticGroup();
  positions.forEach((pos, i) => {
    const orb = group.create(pos.x, pos.y, ORB_KEY);
    orb.setDepth(3).setBlendMode('ADD');
    orb.body.setCircle(14, SIZE / 2 - 14, SIZE / 2 - 14);
    // Leijuu ja sykkii hieman eri tahdissa, ettei rivi näytä mekaaniselta
    scene.tweens.add({ targets: orb, y: pos.y - 8, duration: 900 + (i % 5) * 80, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    scene.tweens.add({ targets: orb, scale: 0.85, duration: 600 + (i % 3) * 120, yoyo: true, repeat: -1 });
  });
  return { group, total: positions.length };
}

// Keruu: pallo lentää ylös ja häviää; törmäys poistetaan heti, ettei sama pallo laske kahdesti
export function collectOrb(scene, orb) {
  orb.body.enable = false;
  scene.tweens.killTweensOf(orb);
  scene.tweens.add({
    targets: orb,
    y: orb.y - 40,
    scale: 1.8,
    alpha: 0,
    duration: 280,
    ease: 'Quad.out',
    onComplete: () => orb.destroy(),
  });
}