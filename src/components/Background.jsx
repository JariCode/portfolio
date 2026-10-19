import { useEffect, useRef } from 'react';
import './Background.css';

// Koko sivun taustalla: hitaasti ajelehtivia neonpisteitä, jotka
// yhdistyvät viivoilla toisiinsa ja hiiren kursoriin.
export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const colors = ['255,61,200', '41,224,255', '178,140,255']; // magenta, syaani, violetti
    const mouse = { x: -9999, y: -9999 };

    let w, h, points, frame;

    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Pisteiden määrä skaalautuu näytön pinta-alaan (mobiilissa vähemmän)
      const count = Math.round(Math.min(90, (w * h) / 16000));
      points = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.6 + 0.4,
        c: colors[Math.floor(Math.random() * colors.length)],
      }));
    }

    function line(a, b, color, alpha, width) {
      ctx.strokeStyle = `rgba(${color},${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < points.length; i++) {
        const a = points[i];

        if (!reduceMotion) {
          a.x += a.vx;
          a.y += a.vy;
          if (a.x < 0 || a.x > w) a.vx *= -1; // kimpoaa reunasta
          if (a.y < 0 || a.y > h) a.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${a.c},0.8)`;
        ctx.fill();

        // Viiva lähellä oleviin pisteisiin: mitä lähempänä, sitä kirkkaampi
        for (let j = i + 1; j < points.length; j++) {
          const b = points[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < 120) line(a, b, a.c, (1 - d / 120) * 0.18, 0.6);
        }

        // Hiiren lähellä pisteet "tarttuvat" kursoriin
        const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
        if (dm < 170) line(a, mouse, a.c, (1 - dm / 170) * 0.55, 0.8);
      }

      if (!reduceMotion) frame = requestAnimationFrame(draw);
    }

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (reduceMotion) draw(); // ilman animaatiota piirretään vain hiiren liikkuessa
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };
    const onResize = () => {
      setup();
      if (reduceMotion) draw();
    };
    // Animaatio pysähtyy, kun välilehti on piilossa (säästää akkua)
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduceMotion) frame = requestAnimationFrame(draw);
    };

    setup();
    draw();
    window.addEventListener('resize', onResize);
    window.addEventListener('pointermove', onMove);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    // Siivous, kun komponentti poistuu
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div className="bg" aria-hidden="true">
      <div className="bg-glow bg-glow--a" />
      <div className="bg-glow bg-glow--b" />
      <canvas ref={canvasRef} className="bg-canvas" />
    </div>
  );
}