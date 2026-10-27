import Guardian from './Guardian.jsx';
import './Guide.css';

// Vartija tulee nurkkaan puhumaan: rintakuva nousee sumusta ja puhekupla avautuu.
// Kupla sulkeutuu napautuksella tai itsestään (ajastin Game.jsx:ssä). Game antaa repliikin
// id:n avaimeksi, joten animaatio alkaa alusta jokaisella uudella repliikillä.
export default function Guide({ line, onClose }) {
  if (!line) return null;
  return (
    <div className="sb-guide" role="status">
      <div className="sb-guide-bust">
        <Guardian variant="bust" mood={line.mood} />
      </div>
      <button type="button" className="sb-guide-bubble" tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={onClose}>
        <span className="sb-guide-text">{line.text}</span>
        <span className="sb-guide-close" aria-hidden="true" />
      </button>
    </div>
  );
}