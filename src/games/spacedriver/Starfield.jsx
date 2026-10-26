import './Starfield.css';

// Rullaava tähtitaivas React-näkymiin: kolme kerrosta eri nopeuksilla (parallaksi), jolloin
// syntyy tunne, että alus lentää eteenpäin. Tähdet ovat taustakuvan liukuvärejä, joten
// DOM-elementtejä on vain muutama. Pelikentällä vastaava tähtikenttä piirretään Phaserilla.

// Toistettava satunnaisuus: sama siemen antaa joka latauksella samat tähdet
function random(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Kerroksen tähdet yhdeksi background-image-arvoksi. Paikat ovat prosentteja ruudusta,
// joka toistuu pystysuunnassa (Starfield.css: background-size 100% 50%).
function stars(count, size, seed, colors) {
  const rnd = random(seed);
  return Array.from({ length: count }, () => {
    const x = (rnd() * 100).toFixed(1);
    const y = (rnd() * 100).toFixed(1);
    const c = colors[Math.floor(rnd() * colors.length)];
    return `radial-gradient(circle at ${x}% ${y}%, ${c} 0 ${size}px, transparent ${size + 0.6}px)`;
  }).join(', ');
}

// Hyperhypyn valoviirut: pitkiä pystysuoria soikioita
function streaks(count, seed) {
  const rnd = random(seed);
  return Array.from({ length: count }, () => {
    const x = (rnd() * 100).toFixed(1);
    const y = (rnd() * 100).toFixed(1);
    const len = Math.round(30 + rnd() * 60);
    return `radial-gradient(ellipse 1px ${len}px at ${x}% ${y}%, rgb(241 236 255 / 0.9), transparent)`;
  }).join(', ');
}

const LAYERS = [
  { name: 'far', image: stars(70, 0.6, 7, ['#6e66a8', '#8a83c0', '#5a5490']) },
  { name: 'mid', image: stars(40, 1, 31, ['#a79fd0', '#29e0ff', '#f1ecff']) },
  { name: 'near', image: stars(18, 1.6, 101, ['#f1ecff', '#ff3dc8', '#29e0ff']) },
];
const WARP = streaks(40, 211);

// warp: hyperhyppy (tähdet venyvät viiruiksi ja vauhti kiihtyy)
export default function Starfield({ warp = false, className = '' }) {
  return (
    <div className={`sd-stars${warp ? ' sd-stars--warp' : ''} ${className}`} aria-hidden="true">
      <div className="sd-stars-nebula" />
      {LAYERS.map((l) => (
        <div key={l.name} className={`sd-stars-layer sd-stars-layer--${l.name}`} style={{ backgroundImage: l.image }} />
      ))}
      <div className="sd-stars-layer sd-stars-layer--warp" style={{ backgroundImage: WARP }} />
    </div>
  );
}