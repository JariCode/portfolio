// Törmäys esteisiin laatan kuvan mukaan, ei koko laatan neliönä. Asteroidit ovat pyöreitä ja
// kiviseinän reuna rosoinen: neliöllä alus osuisi tyhjään kohtaan (opittu Z-Runnerista, jossa
// esteen kuva ei täyttänyt laattaa). Tilesetin läpinäkyvyys luetaan kerran canvasilla, ja
// piste on esteessä, jos sen kohdalla oleva pikseli on peittävä.

const T = 64;
// Tätä läpikuultavampi pikseli ei ole estettä (kuvan reunojen pehmennys)
const SOLID_ALPHA = 100;

export function createHitTest(scene, textureKey, layer) {
  const img = scene.textures.get(textureKey).getSourceImage();
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  const cols = Math.floor(img.width / T);

  // Onko maailman piste (x, y) esteen sisällä
  return (x, y) => {
    const tile = layer.getTileAtWorldXY(x, y);
    if (!tile || tile.index < 1) return false;
    const i = tile.index - 1;
    let lx = Math.floor(x - tile.pixelX);
    let ly = Math.floor(y - tile.pixelY);
    // Tiledissä peilattu laatta: luetaan kuvaa peilattuna
    if (tile.flipX) lx = T - 1 - lx;
    if (tile.flipY) ly = T - 1 - ly;
    const px = (i % cols) * T + lx;
    const py = Math.floor(i / cols) * T + ly;
    return data[(py * img.width + px) * 4 + 3] > SOLID_ALPHA;
  };
}