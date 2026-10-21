import './Zombie.css';

// Yksityiskohtainen zombisiluetti SVG:nä (koordinaatisto 140 × 160, jalat y = 160,
// katse oikealle). Jokainen raaja on oma ryhmänsä, jonka törmäyslaatikon yläreuna on
// nivelen kohdalla: CSS kääntää raajaa nivelestä (transform-box: fill-box).
// variant: 'a' = hiustupot ja raidallinen paita, 'b' = kalju, tikit ja revitty korva.
export default function Zombie({ x, scale = 1, delay = 0, flip = false, variant = 'a' }) {
  return (
    <g transform={`translate(${x} ${885 - 160 * scale}) scale(${flip ? -scale : scale} ${scale})`}>
      <g className={`zr-z zr-z--${variant}`} style={{ '--zr-delay': `${delay}s` }}>
        {/* Takajalka: tummempi, jotta syvyys erottuu */}
        <g className="zr-z-leg zr-z-leg--back">
          <path className="zr-z-pants zr-z-far" d="M44 92 L60 94 L57 122 L59 140 L45 140 L43 122 Z" />
          <path className="zr-z-skin zr-z-far" d="M46 139 L58 139 L58 151 L47 151 Z" />
          <path className="zr-z-shoe" d="M44 150 L60 150 Q68 152 69 158 L43 158 Z" />
          <path className="zr-z-tear" d="M45 140 L48 135 L51 141 L54 134 L57 141 L59 136 L59 140 Z" />
        </g>

        {/* Takakäsi roikkuu vartalon takana */}
        <g className="zr-z-arm zr-z-arm--back">
          <path className="zr-z-shirt zr-z-far" d="M60 50 L74 52 L76 66 L66 68 Z" />
          <path className="zr-z-skin zr-z-far" d="M66 66 L76 64 L83 88 L76 92 Z" />
          <path className="zr-z-skin zr-z-far" d="M75 89 L84 87 L89 95 L86 101 L83 97 L82 103 L78 98 L76 102 Z" />
        </g>

        {/* Vartalo: kumara, paidan helma ja kylki revitty */}
        <path className="zr-z-skin" d="M50 96 Q44 74 52 56 Q60 44 78 46 Q92 50 89 64 Q85 82 74 98 Z" />
        <path
          className="zr-z-shirt"
          d="M51 90 Q45 72 53 56 Q61 45 78 47 Q91 51 88 63 Q85 76 79 88 L76 84 L73 92 L69 86 L66 95 L62 88 L58 96 L55 89 Z"
        />
        <g className="zr-z-stripes">
          <path d="M55 62 Q70 58 86 60" />
          <path d="M53 70 Q69 66 84 69" />
          <path d="M52 78 Q66 75 81 78" />
        </g>
        {/* Reikä paidassa: kylkiluut näkyvät */}
        <path className="zr-z-skin" d="M70 70 Q77 68 80 74 Q78 81 71 80 Q67 76 70 70 Z" />
        <g className="zr-z-ribs">
          <path d="M71 73 Q75 72 78 74" />
          <path d="M70.5 76 Q74.5 75 78.5 77" />
          <path d="M71 79 Q74 78 77 79.5" />
        </g>
        {/* Varjo selän puolella antaa vartalolle muotoa */}
        <path className="zr-z-shade" d="M51 90 Q45 72 53 56 Q57 51 62 49 Q55 64 58 92 Z" />
        <path className="zr-z-pants" d="M48 92 L76 94 L75 100 L49 99 Z" />

        {/* Etujalka astuu eteenpäin, polvi koukussa */}
        <g className="zr-z-leg zr-z-leg--front">
          <path className="zr-z-pants" d="M56 94 L72 96 L80 118 L76 138 L64 138 L68 120 Z" />
          <path className="zr-z-tear" d="M64 138 L67 133 L70 139 L73 132 L76 138 L77 134 L76 138 Z" />
          <path className="zr-z-skin" d="M65 137 L76 137 L75 151 L66 151 Z" />
          <path className="zr-z-shoe" d="M64 150 L78 150 Q88 151 90 158 L63 158 Z" />
        </g>

        {/* Kaula ja pää */}
        <path className="zr-z-skin" d="M80 44 L90 48 L87 57 L77 53 Z" />
        <g className="zr-z-head">
          <path className="zr-z-skin" d="M78 31 Q77 15 92 14 Q106 15 107 30 Q107 40 101 45 L97 52 Q89 55 84 49 Q78 43 78 31 Z" />
          {/* Kallon varjopuoli ja kulmakaari */}
          <path className="zr-z-shade" d="M78 31 Q77 17 89 14 Q82 22 84 36 Q85 44 88 52 Q83 49 80 43 Q78 38 78 31 Z" />
          <path className="zr-z-brow" d="M85 24 Q93 21 103 24" />
          {/* Korva */}
          <path className="zr-z-skin zr-z-ear" d="M80 29 Q75 30 76 35 Q78 38 81 36 Z" />
          {/* Hiustupot (variantti a) ja tikit (variantti b) */}
          <path className="zr-z-hair" d="M80 22 L77 13 L84 18 L84 9 L90 15 L94 7 L97 15 L104 10 L102 19 Q96 15 88 16 Q83 17 80 22 Z" />
          <g className="zr-z-stitch">
            <path d="M83 18 Q92 13 102 18" />
            <path d="M86 14 L87 19 M91 12.5 L91.5 17.5 M96 13 L95.5 18 M100 15 L98.5 19.5" />
          </g>
          {/* Leuka loksahtaa auki ja kiinni */}
          <g className="zr-z-jaw">
            <path className="zr-z-mouth" d="M91 41 Q99 40 104 43 L101 51 Q95 53 91 48 Z" />
            <path className="zr-z-teeth" d="M93 42 L95 45 L97 42 L99 45 L101 42.5 L102.5 44.5 L103 43 Q98 41 93 42 Z" />
            <path className="zr-z-teeth" d="M93 48 L95 46 L96.5 49 L98.5 46.5 L100 49.5 L101 47 L100.5 50.5 Q95 51.5 93 48 Z" />
          </g>
          {/* Silmät: syvät kuopat ja hehku */}
          <ellipse className="zr-z-socket" cx="97" cy="28" rx="5" ry="4.2" />
          <ellipse className="zr-z-socket" cx="88" cy="29" rx="3.8" ry="3.4" />
          <circle className="zr-z-eye" cx="97.5" cy="28" r="2.6" />
          <circle className="zr-z-eye" cx="88.4" cy="29.2" r="1.9" />
        </g>

        {/* Etukäsi ojossa kohti pelaajaa: repeytynyt hiha, luiset sormet */}
        <g className="zr-z-arm zr-z-arm--front">
          <path className="zr-z-skin" d="M78 52 L102 58 L120 56 L121 64 L101 68 L80 62 Z" />
          <path className="zr-z-shirt" d="M77 51 L97 57 L94 61 L98 64 L93 66 L80 63 Z" />
          <path className="zr-z-shade" d="M80 62 L101 68 L121 64 L121 66 L101 70 L80 64 Z" />
          <path
            className="zr-z-skin zr-z-hand"
            d="M118 54 Q125 53 128 56 L135 54 L130 59 L137 60 L130 62 L135 66 L127 66 Q121 68 118 64 Z"
          />
          <path className="zr-z-nails" d="M135 54 L137 53.5 M137 60 L139 60 M135 66 L137 66.5" />
        </g>
      </g>
    </g>
  );
}