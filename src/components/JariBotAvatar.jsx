// Jari-Botin hahmo: robotti, jossa Jarin piirteet (kalju, pukinparta, ruskeat silmät,
// tumma t-paita). Piirretty koodilla, ei ulkopuolisia kuvia.
// talking: suu aukeaa ja sulkeutuu (JariBotAvatar.css), kun botti kirjoittaa vastausta.
import './JariBotAvatar.css';

export default function JariBotAvatar({ talking = false, className = '' }) {
  return (
    <svg
      className={`jb-avatar ${talking ? 'is-talking' : ''} ${className}`}
      viewBox="0 0 200 230"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="jb-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0" stopColor="var(--cyan)" stopOpacity=".28" />
          <stop offset="1" stopColor="var(--cyan)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="jb-dome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3a2f63" />
          <stop offset="1" stopColor="#1b1433" />
        </linearGradient>
        <linearGradient id="jb-beard" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6c6380" />
          <stop offset=".45" stopColor="#bdb6cc" />
          <stop offset="1" stopColor="#e9e5f2" />
        </linearGradient>
      </defs>

      <ellipse className="jb-halo" cx="100" cy="105" rx="95" ry="100" fill="url(#jb-glow)" />

      {/* Antenni: pallo välkkyy */}
      <line x1="100" y1="24" x2="100" y2="9" className="jb-line" strokeWidth="3" />
      <circle className="jb-antenna" cx="100" cy="8" r="5.5" />

      {/* Korvanapit */}
      <rect className="jb-ear" x="30" y="88" width="12" height="34" rx="5" />
      <rect className="jb-ear" x="158" y="88" width="12" height="34" rx="5" />

      {/* Pää: sileä kupoli ja heijastus (kalju), sivuilla lyhyt sänki */}
      <path
        className="jb-head"
        d="M42 100 C42 45 72 22 100 22 C128 22 158 45 158 100 L158 135 C158 170 132 190 100 190 C68 190 42 170 42 135 Z"
        fill="url(#jb-dome)"
      />
      <path className="jb-shine" d="M66 50 C76 36 92 30 108 30" />
      <g className="jb-stubble">
        <path d="M47 80 l3 -4 M50 88 l3 -4 M47 96 l3 -4 M50 104 l3 -4" />
        <path d="M153 80 l-3 -4 M150 88 l-3 -4 M153 96 l-3 -4 M150 104 l-3 -4" />
      </g>

      {/* Kulmakarvat ja silmät (räpsyvät) */}
      <path className="jb-brow" d="M64 86 Q78 80 90 85" />
      <path className="jb-brow" d="M110 85 Q122 80 136 86" />
      <g className="jb-eyes">
        <ellipse className="jb-eye" cx="77" cy="100" rx="11" ry="7" />
        <ellipse className="jb-eye" cx="123" cy="100" rx="11" ry="7" />
        <circle className="jb-iris" cx="77" cy="100" r="4.5" />
        <circle className="jb-iris" cx="123" cy="100" r="4.5" />
        <circle className="jb-spark" cx="78.5" cy="98.5" r="1.4" />
        <circle className="jb-spark" cx="124.5" cy="98.5" r="1.4" />
      </g>

      <path className="jb-nose" d="M100 104 L94 124 Q100 128 106 124" />

      {/* Pukinparta: tummat viikset ja harmaa, alaspäin vaaleneva leukaparta */}
      <path className="jb-moustache" d="M78 140 Q100 130 122 140 L124 150 Q100 142 76 150 Z" />
      <path d="M76 148 Q100 142 124 148 L122 172 Q112 192 100 194 Q88 192 78 172 Z" fill="url(#jb-beard)" />

      {/* Suu: hymy levossa, puhuessa vuorottelee auki ja kiinni */}
      <path className="jb-mouth jb-mouth--smile" d="M90 152 Q100 158 110 152" />
      <ellipse className="jb-mouth jb-mouth--open" cx="100" cy="155" rx="8" ry="5.5" />

      {/* Kaula ja tumma t-paita */}
      <rect className="jb-neck" x="86" y="190" width="28" height="12" />
      <path className="jb-shirt" d="M40 230 C42 210 64 200 100 200 C136 200 158 210 160 230 Z" />
      <text className="jb-shirt-text" x="100" y="224" textAnchor="middle">
        JARI-BOT
      </text>
    </svg>
  );
}
