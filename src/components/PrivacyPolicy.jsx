import { profile } from '../data/profile.js';
import './PrivacyPolicy.css';

const UPDATED = '21.10.2026'; // päivitä, kun sisältö muuttuu

// Lyhyt tietosuojaseloste: sivu kerää tietoja vain yhteydenottolomakkeella
export default function PrivacyPolicy() {
  return (
    <div className="privacy-scroll">
      <article className="privacy">
        <h2>Tietosuojaseloste</h2>
        <p className="privacy-updated">Päivitetty {UPDATED}</p>

        <section>
          <h3>Mitä tietoja kerätään</h3>
          <p>
            Vain ne tiedot, jotka itse annat yhteydenottolomakkeella: nimi, sähköpostiosoite ja viesti.
            Viesti tulee sähköpostiini, eikä sivusto tallenna sitä mihinkään.
          </p>
        </section>

        <section>
          <h3>Mihin niitä käytetään</h3>
          <p>
            Ainoastaan viestiisi vastaamiseen. Tietoja ei luovuteta eteenpäin eikä käytetä
            markkinointiin. Poistan viestin, kun asia on hoidettu, viimeistään 12 kuukauden kuluttua.
          </p>
        </section>

        <section>
          <h3>Evästeet ja videot</h3>
          <p>
            Sivusto ei käytä evästeitä eikä analytiikkaa. Projektien YouTube-trailerit ladataan vasta,
            kun painat toistoa. Silloin Google voi käsitellä tietojasi{' '}
            <a href="https://policies.google.com/privacy?hl=fi" target="_blank" rel="noopener noreferrer">
              omien käytäntöjensä
            </a>{' '}
            mukaisesti.
          </p>
        </section>

        <section>
          <h3>Pelien tallennukset</h3>
          <p>
            Pelialueen pelit tallentavat ennätyksesi ja kaupunginrakennuspelin keskeneräisen kaupungin
            selaimesi omaan muistiin (localStorage), jotta ne säilyvät seuraavaan kertaan. Tallennus
            tapahtuu vain, kun pelaat. Tiedot pysyvät laitteellasi, eivätkä ne siirry minulle tai
            muualle. Voit poistaa ne pelin lopussa olevalla Tyhjennä tallennukset -napilla, jolloin peli
            alkaa alusta, tai tyhjentämällä tämän sivuston tiedot selaimen asetuksista.
          </p>
        </section>

        <section>
          <h3>Oikeutesi</h3>
          <p>
            Voit pyytää nähdä tai poistaa tietosi ottamalla yhteyttä lomakkeella. Rekisterinpitäjä on{' '}
            {profile.name}, {profile.location}. Valituksen voi tehdä{' '}
            <a href="https://tietosuoja.fi" target="_blank" rel="noopener noreferrer">
              tietosuojavaltuutetulle
            </a>
            .
          </p>
        </section>
      </article>
    </div>
  );
}