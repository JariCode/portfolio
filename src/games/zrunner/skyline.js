// Kentän tausta (parallaksi): neonkaupunki tai metrotunneli. Piirretään kerran canvasille
// tekstuureiksi; pelin aikana vain siirretään valmiita kuvia, joten tausta ei kuormita.
// Värit luetaan index.css:n muuttujista, jotta peli ja muu sivu pysyvät samoissa sävyissä.

const TEX_W = 1024; // kerroksen tekstuurin leveys; toistuu saumattomasti vaakasuunnassa

// Kerrokset kaukaa lähelle: factor = kuinka paljon kerros liikkuu suhteessa kameraan
const LAYERS = [
  { key: 'zr-far', factor: 0.12, ground: 600, minH: 200, maxH: 380, minW: 50, maxW: 110, win: 5, gap: 9, lit: 0.3, tone: 0.22 },
  { key: 'zr-mid', factor: 0.25, ground: 660, minH: 170, maxH: 330, minW: 80, maxW: 150, win: 8, gap: 12, lit: 0.34, tone: 0.12 },
  { key: 'zr-near', factor: 0.45, ground: 720, minH: 140, maxH: 280, minW: 120, maxW: 210, win: 12, gap: 16, lit: 0.4, tone: 0.05 },
];

// Siemenellinen satunnaisluku: tausta on joka kerta sama (sama kuin CityScape.jsx:ssä)
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function cssColors() {
  const css = getComputedStyle(document.documentElement);
  const read = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  return {
    ink: read('--ink', '#0e0a26'),
    magenta: read('--magenta', '#ff3dc8'),
    cyan: read('--cyan', '#29e0ff'),
    violet: read('--violet', '#b28cff'),
    text: read('--text', '#f1ecff'),
  };
}

// Kaksi heksaväriä sekoitettuna: vastaa CSS:n color-mixiä, jota canvas ei tunne
function mix(a, b, amount) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (p, shift) => (p >> shift) & 255;
  const out = [16, 8, 0].map((s) => Math.round(ch(pa, s) * amount + ch(pb, s) * (1 - amount)));
  return `rgb(${out.join(',')})`;
}

function drawSky(scene, w, h, c) {
  const tex = scene.textures.createCanvas('zr-sky', w, h);
  const ctx = tex.getContext();
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#05030f');
  sky.addColorStop(0.55, c.ink);
  sky.addColorStop(1, mix(c.violet, c.ink, 0.35));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Magenta hehku horisontissa
  const glow = ctx.createRadialGradient(w / 2, h * 0.8, 0, w / 2, h * 0.8, w * 0.6);
  glow.addColorStop(0, 'rgba(255, 61, 200, 0.28)');
  glow.addColorStop(1, 'rgba(255, 61, 200, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  // Kuu hehkuineen
  const mx = w * 0.78;
  const my = h * 0.2;
  const halo = ctx.createRadialGradient(mx, my, 40, mx, my, 170);
  halo.addColorStop(0, 'rgba(178, 140, 255, 0.22)');
  halo.addColorStop(1, 'rgba(178, 140, 255, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(mx - 170, my - 170, 340, 340);
  ctx.fillStyle = c.text;
  ctx.beginPath();
  ctx.arc(mx, my, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = mix(c.violet, c.text, 0.35);
  ctx.beginPath();
  ctx.arc(mx - 16, my - 10, 9, 0, Math.PI * 2);
  ctx.arc(mx + 18, my + 18, 6, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

function drawLayer(scene, layer, h, c, seed) {
  const rand = seeded(seed);
  const tex = scene.textures.createCanvas(layer.key, TEX_W, h);
  const ctx = tex.getContext();
  const body = layer.tone > 0.1 ? mix(c.violet, c.ink, layer.tone) : '#090616';
  const roof = layer.key === 'zr-near' ? c.magenta : c.cyan;

  // Rakennukset arvotaan tekstuurin yli; reunan yli menevä talo piirretään myös
  // toiseen laitaan, jolloin toistuva kuva jatkuu ilman saumaa
  let x = 0;
  while (x < TEX_W) {
    const w = Math.round(layer.minW + rand() * (layer.maxW - layer.minW));
    const bh = Math.round(layer.minH + rand() * (layer.maxH - layer.minH));
    const top = layer.ground - bh;
    const windows = [];
    for (let wy = top + layer.gap * 1.5; wy < layer.ground - layer.gap * 2; wy += layer.win + layer.gap) {
      for (let wx = layer.gap; wx < w - layer.win - layer.gap / 2; wx += layer.win + layer.gap) {
        if (rand() < layer.lit) windows.push({ wx, wy, magenta: rand() < 0.25 });
      }
    }
    const antenna = rand() < 0.3;

    for (const offset of [0, -TEX_W]) {
      const bx = x + offset;
      if (bx + w < 0) continue;
      ctx.globalAlpha = 1;
      ctx.fillStyle = body;
      ctx.fillRect(bx, top, w, h - top);
      if (antenna) ctx.fillRect(bx + w / 2, top - 28, 3, 28);
      ctx.globalAlpha = layer.key === 'zr-near' ? 0.4 : 0.2;
      ctx.fillStyle = roof;
      ctx.fillRect(bx, top, w, 2);
      ctx.globalAlpha = layer.key === 'zr-far' ? 0.3 : 0.5;
      for (const win of windows) {
        ctx.fillStyle = win.magenta ? c.magenta : c.cyan;
        ctx.fillRect(bx + win.wx, win.wy, layer.win, Math.round(layer.win * 1.3));
      }
    }
    x += w + Math.round(rand() * 12);
  }
  ctx.globalAlpha = 1;
  tex.refresh();
}

// ── Metrotunneli: ei taivasta. Kaukana tunnelin renkaat, keskellä putket ja merkkivalot,
//    lähellä tukipilarien varjot. Samat parallaksikerrokset kuin kaupungissa. ──
const METRO_LAYERS = [
  { key: 'zr-metro-far', factor: 0.12 },
  { key: 'zr-metro-mid', factor: 0.25 },
  { key: 'zr-metro-near', factor: 0.45 },
];

function drawMetroBack(scene, w, h, c) {
  const tex = scene.textures.createCanvas('zr-metro-sky', w, h);
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#04030b');
  g.addColorStop(0.6, '#0a0818');
  g.addColorStop(1, mix(c.violet, c.ink, 0.18));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Kattovalojen heikko kajo tunnelin yläosassa
  const glow = ctx.createLinearGradient(0, 0, 0, h * 0.35);
  glow.addColorStop(0, 'rgba(41, 224, 255, 0.10)');
  glow.addColorStop(1, 'rgba(41, 224, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h * 0.35);
  tex.refresh();
}

function drawMetroLayer(scene, key, h, c) {
  const tex = scene.textures.createCanvas(key, TEX_W, h);
  const ctx = tex.getContext();
  if (key === 'zr-metro-far') {
    // Tunnelin renkaat: kaarevat rivat tasaisin välein (1024 / 8 = 128, toistuu saumatta)
    ctx.strokeStyle = mix(c.violet, c.ink, 0.22);
    ctx.lineWidth = 6;
    for (let x = 64; x < TEX_W; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x - 30, h * 0.45, x, 40);
      ctx.stroke();
    }
    ctx.fillStyle = mix(c.violet, c.ink, 0.12);
    ctx.fillRect(0, 34, TEX_W, 10);
  } else if (key === 'zr-metro-mid') {
    // Putket ja kaapelikourut, välillä keltainen merkkivalo
    ctx.fillStyle = '#141029';
    ctx.fillRect(0, 120, TEX_W, 14);
    ctx.fillRect(0, 150, TEX_W, 8);
    ctx.fillStyle = '#1b1636';
    for (let x = 0; x < TEX_W; x += 128) ctx.fillRect(x, 110, 10, 52);
    ctx.fillStyle = '#ffc23d';
    for (let x = 64; x < TEX_W; x += 256) {
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(x, 142, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, 142, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Tukipilarien varjot etualalla, harvassa
    ctx.fillStyle = '#07060f';
    for (let x = 160; x < TEX_W; x += 512) {
      ctx.fillRect(x, 0, 46, h);
      ctx.fillStyle = mix(c.cyan, '#07060f', 0.12);
      ctx.fillRect(x, 0, 3, h);
      ctx.fillStyle = '#07060f';
    }
  }
  tex.refresh();
}

// Luo taustan scenen alimmaksi; palauttaa funktion, joka päivittää kerrokset kameran mukaan.
// theme: 'city' (Neonkatu) tai 'metro' (Metrotunneli)
export function createSkyline(scene, theme = 'city') {
  const { width, height } = scene.scale;
  const colors = cssColors();
  const metro = theme === 'metro';
  const layers = metro ? METRO_LAYERS : LAYERS;
  const skyKey = metro ? 'zr-metro-sky' : 'zr-sky';

  // Tekstuurit piirretään vain kerran pelin aikana; uusi yritys käyttää samoja
  if (!scene.textures.exists(skyKey)) {
    if (metro) {
      drawMetroBack(scene, width, height, colors);
      METRO_LAYERS.forEach((layer) => drawMetroLayer(scene, layer.key, height, colors));
    } else {
      drawSky(scene, width, height, colors);
      LAYERS.forEach((layer, i) => drawLayer(scene, layer, height, colors, 7 + i * 14));
    }
  }

  scene.add.image(0, 0, skyKey).setOrigin(0).setScrollFactor(0).setDepth(-10);
  const sprites = layers.map((layer, i) =>
    scene.add
      .tileSprite(0, 0, width, height, layer.key)
      .setOrigin(0)
      .setScrollFactor(0)
      .setDepth(-9 + i),
  );

  return (camera) => {
    sprites.forEach((sprite, i) => {
      sprite.tilePositionX = camera.scrollX * layers[i].factor;
    });
  };
}