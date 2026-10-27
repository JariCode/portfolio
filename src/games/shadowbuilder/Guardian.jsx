import { useId } from 'react';
import './Guardian.css';

// Varjojen vartija: huppupäinen hahmo, joka kertoo tarinan ja opastaa. Piirretty SVG:llä.
// Kasvot ovat hupun pimeyttä; ilme näkyy vain hehkuvista silmistä (mood).
// Valo tulee oikealta neonkyltistä (violetti reunavalo) ja vasemmalta kuusta.
// Liike (viitta, valopallo, silmien räpäys, sumu) on Guardian.css:ssä, jotta React ei
// piirrä hahmoa uudelleen joka ruudulla.
//
// mood:    'rauhallinen' | 'iloinen' | 'huolissaan' | 'yllattynyt'
// variant: 'full' = koko hahmo sauvoineen, 'bust' = rintakuva puhekuplan viereen

const VIEW = { full: '60 30 300 650', bust: '120 92 160 170' };

function Eyes({ mood }) {
  if (mood === 'iloinen') {
    return (
      <>
        <path d="M178 160 Q186 152 194 160 Q186 157 178 160Z" />
        <path d="M206 160 Q214 152 222 160 Q214 157 206 160Z" />
      </>
    );
  }
  if (mood === 'huolissaan') {
    return (
      <>
        <path d="M178 156 L194 160 L193 163 L179 160Z" />
        <path d="M222 156 L206 160 L207 163 L221 160Z" />
      </>
    );
  }
  if (mood === 'yllattynyt') {
    return (
      <>
        <ellipse cx="186" cy="158" rx="4.6" ry="5.4" />
        <ellipse cx="214" cy="158" rx="4.6" ry="5.4" />
      </>
    );
  }
  return (
    <>
      <path d="M178 159 Q186 153 194 159 Q186 163 178 159Z" />
      <path d="M206 159 Q214 153 222 159 Q214 163 206 159Z" />
    </>
  );
}

export default function Guardian({ mood = 'rauhallinen', variant = 'full', className = '' }) {
  // Jokaisella hahmolla omat liukuvärien tunnisteet: samalla sivulla voi olla kaksi hahmoa
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const id = (name) => `sb-${uid}-${name}`;
  const url = (name) => `url(#${id(name)})`;
  const full = variant === 'full';

  return (
    <svg
      className={`sb-guardian sb-guardian--${variant} ${className}`.trim()}
      viewBox={VIEW[variant]}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={id('coatL')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2a2550" />
          <stop offset=".35" stopColor="#1a1536" />
          <stop offset="1" stopColor="#0e0b22" />
        </linearGradient>
        <linearGradient id={id('coatR')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0e0b22" />
          <stop offset=".6" stopColor="#1d1640" />
          <stop offset=".92" stopColor="#3d2b78" />
          <stop offset="1" stopColor="#8f6ae0" />
        </linearGradient>
        <linearGradient id={id('hood')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2b2754" />
          <stop offset=".45" stopColor="#1a1538" />
          <stop offset=".9" stopColor="#3a2a74" />
          <stop offset="1" stopColor="#a07cf0" />
        </linearGradient>
        <radialGradient id={id('void')} cx=".5" cy=".42" r=".6">
          <stop offset="0" stopColor="#020108" />
          <stop offset=".7" stopColor="#070418" />
          <stop offset="1" stopColor="#140d33" />
        </radialGradient>
        <linearGradient id={id('scarf')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1c1838" />
          <stop offset=".8" stopColor="#2a1f55" />
          <stop offset="1" stopColor="#7d5cd0" />
        </linearGradient>
        <linearGradient id={id('tunic')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#14112b" />
          <stop offset="1" stopColor="#2a2050" />
        </linearGradient>
        <linearGradient id={id('leg')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#15122c" />
          <stop offset=".8" stopColor="#211a42" />
          <stop offset="1" stopColor="#6a4fb8" />
        </linearGradient>
        <linearGradient id={id('boot')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#120e24" />
          <stop offset=".85" stopColor="#241b48" />
          <stop offset="1" stopColor="#9b78ec" />
        </linearGradient>
        <linearGradient id={id('staff')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#1c1430" />
          <stop offset=".6" stopColor="#3b2a5e" />
          <stop offset="1" stopColor="#c7aaff" />
        </linearGradient>
        <radialGradient id={id('orb')} r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset=".18" stopColor="#e6d9ff" stopOpacity=".9" />
          <stop offset=".45" stopColor="#b28cff" stopOpacity=".45" />
          <stop offset="1" stopColor="#b28cff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('mist')} r=".5">
          <stop offset="0" stopColor="#8e78d8" stopOpacity=".35" />
          <stop offset="1" stopColor="#8e78d8" stopOpacity="0" />
        </radialGradient>
        {/* Silmien hehku: ainoa suodatin, pieni alue */}
        <filter id={id('eyeGlow')} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feFlood floodColor="#b28cff" />
          <feComposite in2="b" operator="in" result="c" />
          <feMerge>
            <feMergeNode in="c" />
            <feMergeNode in="c" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {full && (
        <>
          {/* Varjo maassa ja sumu jalkojen ympärillä */}
          <ellipse cx="200" cy="664" rx="110" ry="11" fill="#000" opacity=".5" />
          <ellipse className="sb-guardian-mist" cx="200" cy="650" rx="150" ry="28" fill={url('mist')} />

          {/* Sauva ja valopallo */}
          <g className="sb-guardian-staff">
            <path d="M302 108 L306 108 L309 662 L299 662Z" fill={url('staff')} />
            <path d="M300 160 h8 M300 230 h9 M299 520 h10" stroke="#b28cff" strokeOpacity=".6" strokeWidth="1.4" />
            <path d="M304 108 C292 100 292 82 300 74 M304 108 C316 100 316 82 308 74" stroke="#3b2a5e" strokeWidth="3" fill="none" />
            <circle className="sb-guardian-orb-glow" cx="304" cy="88" r="58" fill={url('orb')} />
            <circle cx="304" cy="88" r="12" fill="#f6f0ff" />
            <circle cx="304" cy="88" r="17" fill="none" stroke="#e6d9ff" strokeOpacity=".7" />
            <circle className="sb-guardian-orb-ring" cx="304" cy="88" r="25" fill="none" stroke="#b28cff" strokeOpacity=".4" strokeDasharray="3 5" />
          </g>

          {/* Jalat ja saappaat */}
          <path d="M181 470 L199 470 L197 632 L179 632Z" fill={url('leg')} />
          <path d="M203 470 L221 470 L226 632 L207 632Z" fill={url('leg')} />
          <path d="M176 626 L199 626 L200 650 C200 660 194 664 184 664 L166 664 C160 664 160 656 166 652 L176 646Z" fill={url('boot')} />
          <path d="M205 626 L228 626 L230 646 L240 652 C246 656 246 664 240 664 L220 664 C210 664 205 660 205 650Z" fill={url('boot')} />
          <path d="M178 634 h20 M206 634 h21 M178 642 h21 M206 642 h22" stroke="#4a3a80" strokeWidth="1.6" />
        </>
      )}

      {/* Tunika, vyö ja olkahihna */}
      <path d="M184 250 L216 250 L222 486 L178 486Z" fill={url('tunic')} />
      <path d="M188 262 L214 420" stroke="#3a2c6c" strokeWidth="5" />
      <path d="M188 262 L214 420" stroke="#8f6ae0" strokeOpacity=".35" strokeWidth="1" />
      <rect x="179" y="346" width="42" height="11" rx="2" fill="#1c1532" stroke="#5e45a8" strokeWidth="1" />
      <rect x="195" y="345" width="11" height="13" rx="2" fill="none" stroke="#cdb6ff" strokeWidth="1.6" />
      <path d="M182 357 l4 22 h12 l2 -22" fill="#221a40" stroke="#4a3a80" />

      {/* Takki: helmat liehuvat (Guardian.css) */}
      <g className="sb-guardian-coat sb-guardian-coat--left">
        <path d="M172 236 L142 244 C130 280 126 336 124 384 L110 604 L120 598 L128 610 L140 600 L152 612 L164 600 L176 608 L188 596 C190 520 190 440 191 380 C192 320 194 280 196 258Z" fill={url('coatL')} />
        <path d="M150 300 C146 380 140 470 132 590" stroke="#07051a" strokeOpacity=".55" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M168 320 C166 410 164 500 160 596" stroke="#07051a" strokeOpacity=".5" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M140 330 C136 420 128 500 122 586" stroke="#4a3f86" strokeOpacity=".35" strokeWidth="1.4" fill="none" />
        <path d="M188 596 C190 520 190 440 191 380 C192 320 194 280 196 258" stroke="#3d3270" strokeWidth="1.2" fill="none" />
      </g>
      <g className="sb-guardian-coat sb-guardian-coat--right">
        <path d="M228 236 L258 244 C270 280 274 336 276 384 L292 604 L282 598 L274 610 L262 600 L250 612 L238 600 L226 608 L212 596 C210 520 210 440 209 380 C208 320 206 280 204 258Z" fill={url('coatR')} />
        <path d="M244 300 C250 380 256 470 266 590" stroke="#07051a" strokeOpacity=".55" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M228 320 C230 410 232 500 238 596" stroke="#07051a" strokeOpacity=".5" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <path d="M262 320 C268 410 276 500 284 590" stroke="#b28cff" strokeOpacity=".35" strokeWidth="1.4" fill="none" />
        <path d="M276 384 L292 604" stroke="#c7aaff" strokeOpacity=".8" strokeWidth="1.4" fill="none" />
        <path d="M212 596 C210 520 210 440 209 380 C208 320 206 280 204 258" stroke="#7d5cd0" strokeOpacity=".7" strokeWidth="1.2" fill="none" />
      </g>

      {/* Vasen käsi roikkuu */}
      <path d="M148 246 C130 262 122 300 118 344 L108 422 C118 432 136 432 146 422 L152 360 C156 316 156 280 156 256Z" fill={url('coatL')} />
      <path d="M124 330 C120 360 116 390 112 418" stroke="#07051a" strokeOpacity=".5" strokeWidth="2" fill="none" />
      <path d="M110 418 C120 426 134 426 144 418" stroke="#4a3f86" strokeWidth="1.4" fill="none" />
      <path d="M114 424 C112 438 114 452 120 460 C124 465 132 464 134 458 L138 440 C140 432 136 426 130 426Z" fill="#17122c" />
      <path d="M120 460 C118 466 122 470 126 468 M126 461 C126 468 131 470 133 465" stroke="#2e2456" strokeWidth="2" fill="none" />

      {/* Oikea käsi koholla: ote sauvasta (rintakuvassa sauva ja käsi jäävät pois) */}
      {full && (
        <>
          <path d="M248 246 C266 256 284 282 294 312 C298 324 296 338 288 342 L276 338 C272 316 262 294 250 282Z" fill={url('coatR')} />
          <path d="M280 336 C292 330 302 304 306 286 L296 280 C290 298 282 316 272 328Z" fill={url('coatR')} />
          <path d="M294 312 C298 324 296 338 288 342" stroke="#c7aaff" strokeOpacity=".8" strokeWidth="1.4" fill="none" />
          <path d="M293 266 C291 258 300 254 312 256 C318 258 318 266 316 274 L314 288 C306 292 296 290 293 284Z" fill="#17122c" />
          <path d="M296 268 h18 M296 275 h19 M296 282 h18" stroke="#3a2d6a" strokeWidth="1.6" />
          <path d="M316 260 C320 266 320 278 314 288" stroke="#a07cf0" strokeOpacity=".9" strokeWidth="1.2" fill="none" />
        </>
      )}

      {/* Harteiden viitta */}
      <path d="M150 214 C138 228 132 252 134 280 C144 290 160 292 170 284 C182 294 218 294 230 284 C240 292 256 290 266 280 C268 252 262 228 250 214Z" fill={url('hood')} />
      <path d="M134 280 C144 290 160 292 170 284 C182 294 218 294 230 284 C240 292 256 290 266 280" stroke="#07051a" strokeOpacity=".6" strokeWidth="2" fill="none" />
      <path d="M266 280 C268 252 262 228 250 214" stroke="#d2bcff" strokeOpacity=".85" strokeWidth="1.6" fill="none" />
      <path d="M160 232 C156 250 154 266 156 284 M240 232 C244 250 246 266 244 284" stroke="#07051a" strokeOpacity=".45" strokeWidth="2" fill="none" />

      {/* Pää: huivi, huppu ja kasvojen pimeys pienennettynä luonnollisiin mittasuhteisiin */}
      <g transform="translate(200 246) scale(.8) translate(-200 -246)">
        <path d="M172 196 C176 216 186 228 200 230 C214 228 224 216 228 196 C232 210 232 226 224 238 C214 248 186 248 176 238 C168 226 168 210 172 196Z" fill={url('scarf')} />
        <path d="M210 236 L216 268 L206 266 L204 238Z" fill={url('scarf')} />

        <path d="M200 78 C170 78 146 98 138 132 C132 160 134 192 144 214 C152 230 164 238 176 240 C170 226 166 206 166 186 C166 140 178 116 200 112 C222 116 234 140 234 186 C234 206 230 226 224 240 C236 238 248 230 256 214 C266 192 268 160 262 132 C254 98 230 78 200 78Z" fill={url('hood')} />
        <path d="M200 112 C178 116 166 140 166 186 C166 206 170 226 176 240 L224 240 C230 226 234 206 234 186 C234 140 222 116 200 112Z" fill={url('void')} />

        {/* Huivi nostettu nenälle: kasvoista näkyvät vain silmät */}
        <path d="M167 176 C182 186 218 186 233 176 C235 196 232 222 224 240 L176 240 C168 222 165 196 167 176Z" fill={url('scarf')} />
        <path d="M170 192 C186 200 214 200 230 192 M172 208 C188 216 212 216 228 208 M176 224 C190 230 210 230 224 224" stroke="#07051a" strokeOpacity=".5" strokeWidth="1.6" fill="none" />
        <path d="M233 176 C235 196 232 222 224 240" stroke="#c7aaff" strokeOpacity=".7" strokeWidth="1.3" fill="none" />

        <g className="sb-guardian-eyes" fill="#f3ecff" filter={url('eyeGlow')}>
          <Eyes mood={mood} />
        </g>

        <path d="M200 112 C222 116 234 140 234 186 C234 206 230 226 224 240" stroke="#b28cff" strokeOpacity=".55" strokeWidth="1.5" fill="none" />
        <path d="M200 112 C178 116 166 140 166 186 C166 206 170 226 176 240" stroke="#3d3270" strokeWidth="1.5" fill="none" />
        <path d="M262 132 C268 160 266 192 256 214" stroke="#e0d0ff" strokeOpacity=".9" strokeWidth="1.8" fill="none" />
        <path d="M200 80 C214 90 222 100 226 116 M200 80 C186 90 178 100 174 116" stroke="#07051a" strokeOpacity=".5" strokeWidth="2" fill="none" />
        <path d="M146 150 C148 180 154 204 166 222 M254 150 C252 180 246 204 234 222" stroke="#07051a" strokeOpacity=".45" strokeWidth="2" fill="none" />
        <path d="M141 140 C138 170 142 196 152 214" stroke="#5a4e98" strokeOpacity=".5" strokeWidth="1.2" fill="none" />
      </g>
    </svg>
  );
}