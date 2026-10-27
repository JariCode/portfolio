import './Logo.css';

// Pelin logo: kirjaimet neonin hohteessa ja niiden alla pitkä varjo, joka kääntyy hitaasti
// kuin valonlähde kiertäisi (pelin idea: varjojen suunta tulee valosta).
// Varjo on sama teksti käännettynä ja kallistettuna, joten se seuraa kirjainten muotoa.
export default function Logo({ className = '' }) {
  const lines = (
    <>
      <span className="sb-logo-line sb-logo-shadow-word">Shadow</span>
      <span className="sb-logo-line sb-logo-builder">Builder</span>
    </>
  );
  return (
    <div className={`sb-logo ${className}`.trim()}>
      <h3 className="sb-logo-text" aria-label="Shadow Builder">
        <span aria-hidden="true">{lines}</span>
      </h3>
      <p className="sb-logo-cast" aria-hidden="true">
        {lines}
      </p>
    </div>
  );
}