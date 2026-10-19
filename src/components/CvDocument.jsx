import { profile, socials } from '../data/profile.js';
import { cvProfile, work, education, skills, languages, certificates, courses, hobbies } from '../data/cv.js';
import './CvDocument.css';

// Linkit, jotka näytetään CV:ssä
const CV_LINKS = socials.filter((s) => ['LinkedIn', 'GitHub'].includes(s.name));

function Entries({ items }) {
  return items.map((item) => (
    <div key={item.title + item.time} className="cvd-entry">
      <p className="cvd-time">{item.time}</p>
      <h4>{item.title}</h4>
      <p>{item.text}</p>
    </div>
  ));
}

// Koko CV yhtenä asiakirjana. Näytöllä neonteemassa, tulostettaessa puhtaana valkoisena.
export default function CvDocument() {
  return (
    <div className="cvd-scroll">
      <div className="cvd-toolbar no-print">
        <button type="button" className="btn btn--cyan" onClick={() => window.print()}>
          Tulosta tai tallenna PDF:ksi
        </button>
      </div>

      <article className="cvd" aria-label={`${profile.name} – CV`}>
        <header className="cvd-header">
          <img className="cvd-photo" src={profile.cvPhoto} alt={profile.name} width="120" height="150" />
          <div>
            <h3 className="cvd-name">{profile.name}</h3>
            <p className="cvd-role">{profile.role}</p>
            <ul className="cvd-contact">
              <li>{profile.location}</li>
              <li>
                <a href={`tel:${profile.phoneHref}`}>{profile.phone}</a>
              </li>
              <li>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </li>
              <li>
                <a href={`https://${profile.site}`}>{profile.site}</a>
              </li>
            </ul>
          </div>
        </header>

        <div className="cvd-body">
          <aside className="cvd-side">
            <section>
              <h4 className="cvd-heading">IT-taidot</h4>
              <ul className="cvd-list">
                {skills.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="cvd-heading">Kielitaito</h4>
              <ul className="cvd-list">
                {languages.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="cvd-heading">Sertifikaatit</h4>
              <ul className="cvd-list">
                {certificates.map((c) => (
                  <li key={c.name}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer">{c.name}</a>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="cvd-heading">Linkit</h4>
              <ul className="cvd-list">
                {CV_LINKS.map((l) => (
                  <li key={l.name}>
                    {l.name}: <a href={l.href} target="_blank" rel="noopener noreferrer">{l.href.replace(/^https:\/\/(fi\.)?/, '')}</a>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="cvd-heading">Kurssit</h4>
              <ul className="cvd-list">
                {courses.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </section>
          </aside>

          <div className="cvd-main">
            <section>
              <h4 className="cvd-heading">Profiili</h4>
              <p>{cvProfile}</p>
            </section>

            <section>
              <h4 className="cvd-heading">Työkokemus</h4>
              <Entries items={work} />
            </section>

            <section>
              <h4 className="cvd-heading">Koulutus</h4>
              {/* Vain CV:hen kuuluvat koulutukset (cv: false jätetään pois) */}
              <Entries items={education.filter((e) => e.cv !== false)} />
            </section>

            <section>
              <h4 className="cvd-heading">Harrastukset</h4>
              <p>{hobbies}</p>
            </section>
          </div>
        </div>
      </article>
    </div>
  );
}