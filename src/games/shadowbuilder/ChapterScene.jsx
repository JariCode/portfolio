import './ChapterScene.css';

// Luvun vaihtumisen välianimaatio: taivas tummuu hetkeksi, uusi neonkyltti syttyy välähdellen
// ja luvun nimi pyyhkäistään näkyviin. Peli jatkuu taustalla; Game.jsx poistaa tämän 3,6 s
// kuluttua (sama kesto kuin animaatiossa).
export default function ChapterScene({ chapter }) {
  return (
    <div className="sb-chapter" role="status">
      <div className="sb-chapter-veil" aria-hidden="true" />
      <svg className="sb-chapter-sign" viewBox="0 0 40 160" aria-hidden="true">
        <rect className="sb-chapter-sign-glow" x="3" y="3" width="34" height="154" rx="4" />
        <rect className="sb-chapter-sign-tube" x="3" y="3" width="34" height="154" rx="4" />
        <path
          className="sb-chapter-sign-glyph"
          d="M12 26 l8 -14 l8 14z M20 50 l9 10 l-9 10 l-9 -10z M11 88 h18 M11 96 h18 M20 122 m-8 0 a8 8 0 1 0 16 0 a8 8 0 1 0 -16 0 M12 138 l16 8"
        />
      </svg>
      <p className="sb-chapter-text">
        <span className="sb-chapter-n">Luku {chapter.n}</span>
        <span className="sb-chapter-name">{chapter.name}</span>
      </p>
    </div>
  );
}