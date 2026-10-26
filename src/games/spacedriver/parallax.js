// Pelikentän tähtitaivas: kolme kerrosta, jotka rullaavat eri nopeuksilla (parallaksi).
// Tähdet piirretään kerran tekstuureiksi Graphicsilla, ei kuvatiedostoina. Kerrokset ovat
// kartan takana, joten Tiledissä ei piirretä tähtiä lainkaan.

// [kerroksen nopeus suhteessa karttaan, tähtien määrä, koko px, värit, oma liike px/s]
// Oma liike pitää tähdet liikkeessä myös silloin, kun kartta on jo pysähtynyt loppuun.
const LAYERS = [
  [0.15, 90, 2, [0x6b6496, 0x484a77], 6],
  [0.35, 55, 2, [0xa79fd0, 0x4d9be6], 14],
  [0.6, 26, 4, [0xffffff, 0x8fd3ff, 0xffb547], 26],
];

// Toistuva siemen: tähdet ovat samoissa kohdissa joka pelikerralla
function random(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export function createStarfield(scene, width, height) {
  const rand = random(2026);
  const sprites = LAYERS.map(([, count, size, colors], n) => {
    const key = `sd-tahdet-${n}`;
    if (!scene.textures.exists(key)) {
      const g = scene.make.graphics({ x: 0, y: 0 }, false);
      for (let i = 0; i < count; i++) {
        const x = Math.floor(rand() * width);
        const y = Math.floor(rand() * height);
        const s = rand() < 0.2 ? size : Math.max(1, size / 2);
        g.fillStyle(colors[i % colors.length], 0.5 + rand() * 0.5);
        g.fillRect(x, y, s, s);
      }
      g.generateTexture(key, width, height);
      g.destroy();
    }
    return scene.add.tileSprite(0, 0, width, height, key).setOrigin(0).setScrollFactor(0).setDepth(0);
  });

  // Kutsutaan joka ruudulla: scrollY = kameran kohta kartalla, time = kulunut aika (s)
  return (scrollY, time) => {
    sprites.forEach((s, n) => {
      const [factor, , , , drift] = LAYERS[n];
      s.tilePositionY = scrollY * factor - time * drift;
    });
  };
}