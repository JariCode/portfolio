import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useSpring, useReducedMotion } from 'motion/react';
import { socials } from '../data/profile.js';
import ScrambleText from './ScrambleText.jsx';
import './Contact.css';

// Maski asetetaan suoraan elementille: silloin suhteellinen polku (img/...) lasketaan
// sivun osoitteesta. CSS-muuttujan kautta polku laskettaisiin buildissa /assets/-kansiosta.
const iconMask = (icon) => ({ maskImage: `url(${icon})`, WebkitMaskImage: `url(${icon})` });

const CONTACT_SOCIALS = socials.filter((s) => s.contact);
const MAX_MESSAGE = 3000;

// Neonkyltin teksti lomakkeen tilan mukaan
const SIGN = {
  idle: 'AUKI',
  typing: 'AUKI',
  sending: 'LÄHETETÄÄN',
  sent: 'KIITOS!',
  error: 'VIRHE',
};

// Tarkistukset ennen lähetystä; palauttaa virheilmoitukset kentittäin
function validate({ name, email, message }) {
  const errors = {};
  if (name.trim().length < 2) errors.name = 'Kirjoita nimesi.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Tarkista sähköpostiosoite.';
  if (message.trim().length < 10) errors.message = 'Kirjoita vähintään 10 merkkiä.';
  return errors;
}

// ═══ Somekortti, joka "vetää" kursoria puoleensa ═══
function SocialCard({ social }) {
  const reduceMotion = useReducedMotion();
  const x = useSpring(0, { stiffness: 200, damping: 15 });
  const y = useSpring(0, { stiffness: 200, damping: 15 });

  function onMove(e) {
    if (reduceMotion) return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.2);
    y.set((e.clientY - r.top - r.height / 2) * 0.2);
  }

  function onLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      className={`social-card social-card--${social.name.toLowerCase()}`}
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ x, y }}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <span className="social-icon" style={iconMask(social.icon)} aria-hidden="true" />
      <span className="social-text">
        <span className="social-name">{social.name}</span>
        <span className="social-handle">{social.handle}</span>
      </span>
      <span className="social-arrow" aria-hidden="true" />
    </motion.a>
  );
}

// ═══ Lomakekenttä kelluvalla otsikolla ═══
function Field({ id, label, error, multiline, ...props }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className={`field ${error ? 'field--error' : ''}`}>
      <Tag
        id={id}
        name={id}
        className="field-input"
        placeholder=" "
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        {...props}
      />
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <span className="field-line" aria-hidden="true" />
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Contact({ onOpenPrivacy }) {
  const [values, setValues] = useState({ name: '', email: '', message: '' });
  const [website, setWebsite] = useState(''); // hunajapurkki boteille
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [feedback, setFeedback] = useState('');
  const startedAt = useRef(0);

  // Lomakkeen avausaika: palvelin hylkää liian nopeat (botti)lähetykset
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Kiitos-kyltti palaa hetken päästä AUKI-tilaan
  useEffect(() => {
    if (status !== 'sent') return;
    const t = setTimeout(() => setStatus('idle'), 6000);
    return () => clearTimeout(t);
  }, [status]);

  function onChange(e) {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((err) => ({ ...err, [name]: undefined }));
    if (status !== 'sending') setStatus('typing');
    if (status === 'error') setFeedback(''); // vanha virheilmoitus pois, kun käyttäjä korjaa
  }

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus('error');
      setFeedback('Korjaa merkityt kentät.');
      return;
    }

    setStatus('sending');
    setFeedback('');

    try {
      const res = await fetch('contact.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, website, startedAt: startedAt.current }),
      });
      // Jos palvelin ei vastaa JSONilla (esim. ei PHP:tä), näytetään selkeä viesti
      const data = await res.json().catch(() => null);
      if (!data) throw new Error('Lomakkeen palvelin ei vastannut. Yritä hetken päästä uudelleen.');
      if (!res.ok || !data.ok) throw new Error(data.message);

      setStatus('sent');
      setFeedback('Viesti lähti! Palaan asiaan mahdollisimman pian.');
      setValues({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setFeedback(err.message || 'Viestin lähetys ei onnistunut. Yritä hetken päästä uudelleen.');
    }
  }

  const lit = status !== 'idle';

  return (
    <section id="yhteys" className="section contact">
      <div className="contact-intro">
        <ScrambleText as="h2" className="section-title" text="Ota yhteyttä" />
        <p className="contact-lead">
          Kerro projektistasi, avoimesta työpaikasta tai vaikka vain moikkaa. Vastaan mahdollisimman pian.
        </p>

        <div className="social-grid">
          {CONTACT_SOCIALS.map((s) => (
            <SocialCard key={s.name} social={s} />
          ))}
        </div>
      </div>

      <form className={`contact-form contact-form--${status}`} onSubmit={onSubmit} noValidate>
        {/* Neonkyltti kertoo lomakkeen tilan */}
        <div className="contact-sign" aria-hidden="true">
          <AnimatePresence mode="wait">
            <motion.span
              key={SIGN[status] + lit}
              className={`contact-sign-text ${lit ? 'is-lit' : ''}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {SIGN[status]}
            </motion.span>
          </AnimatePresence>
        </div>

        <Field id="name" label="Nimi" value={values.name} onChange={onChange} error={errors.name} autoComplete="name" maxLength={80} />
        <Field id="email" label="Sähköposti" type="email" value={values.email} onChange={onChange} error={errors.email} autoComplete="email" maxLength={120} />
        <Field
          id="message"
          label="Viesti"
          multiline
          rows={4}
          value={values.message}
          onChange={onChange}
          error={errors.message}
          maxLength={MAX_MESSAGE}
        />
        <p className="field-count" aria-hidden="true">
          {values.message.length} / {MAX_MESSAGE}
        </p>

        {/* Hunajapurkki: piilossa ihmisiltä ja ruudunlukijoilta */}
        <div className="hp" aria-hidden="true">
          <label htmlFor="website">Verkkosivu</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <button type="submit" className="btn contact-submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Lähetetään…' : 'Lähetä viesti'}
          <span className="send-icon" aria-hidden="true" />
        </button>

        {/* Kävijälle kerrotaan ennen lähetystä, miten tietoja käsitellään */}
        <p className="contact-consent">
          Lähettämällä viestin tietojasi käsitellään{' '}
          <button type="button" className="contact-privacy" onClick={onOpenPrivacy}>
            tietosuojaselosteen
          </button>{' '}
          mukaisesti.
        </p>

        <p className={`contact-feedback contact-feedback--${status}`} role="status" aria-live="polite">
          {feedback}
        </p>
      </form>
    </section>
  );
}