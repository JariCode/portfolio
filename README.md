# JariCode – Portfolio

Portfoliosivusto, joka kokoaa esittelyn, projektit, CV:n ja yhteydenottolomakkeen yhdelle sivulle. Ulkoasu on neonvaloinen yökaupunki: hehkuvat neonputket, HUD-kehykset ja animaatiot, jotka reagoivat kävijän liikkeisiin.

**Sivusto:** https://jaricode.fi/

## Tekniikka

| Osa-alue | Ratkaisu |
|---|---|
| Käyttöliittymä | React 19 |
| Kehitys ja build | Vite |
| Animaatiot | [motion](https://motion.dev/) |
| Tyylit | CSS: muuttujat, grid, `clamp()`, jokaisella komponentilla oma tyylitiedosto |
| Fontit | Fontsource-npm-paketit, ladataan omalta palvelimelta |
| Lomakkeen palvelinpuoli | PHP |
| Palvelinasetukset | `.htaccess` (tietoturvaotsakkeet ja välimuisti) |
| Laatu | ESLint |

## Osiot ja toiminnallisuus

### Hero
- Nimi syttyy kirjain kerrallaan välkkyvänä neonkylttinä
- Kirjaimet kirkastuvat ja nousevat, kun hiiri tulee lähelle
- Koodi-ikkuna kirjoittaa esittelyn JavaScript-oliona merkki kerrallaan

### Esittely
- HUD-kehyksinen kuva kallistuu 3D:nä hiiren mukaan, ja sen läpi kulkee skannausviiva
- Osaamis- ja harrastuslaput leijuvat kuvan ympärillä eri syvyyksillä (parallaksi)
- Esittelyteksti rullaa automaattisesti ja pysähtyy hiiren alla tai napista

### Projektit
- Esittelylava vaihtaa projektia automaattisesti, ja edistymispalkki näyttää ajan
- Vaihto pysähtyy, kun osio ei ole näkyvissä tai kävijä on sen päällä
- Suodatus teknologian ja tilan mukaan, pienoiskuvarivi, nuolinapit ja pyyhkäisy
- YouTube-trailerit avautuvat modaaliin sivun sisällä

### CV
- Koko CV modaalissa, tulostettavissa ja tallennettavissa PDF:ksi yhdelle A4-sivulle
- Video-CV, jonka esikatselu pyörii äänettä hiiren ollessa kortin päällä
- Työkokemuksen ja koulutuksen aikajanat piirtyvät rullatessa
- Sertifikaatit kallistuvat 3D:nä ja avautuvat isoksi linkkeineen varmenteisiin

### Ota yhteyttä
- Lomakkeen tila (avoinna, lähetetään, kiitos, virhe) näkyy neonkyltissä
- Kelluvat kenttäotsikot ja kenttäkohtaiset virheilmoitukset
- Somekortit seuraavat hiirtä magneettimaisesti

### Muuta
- Hiireen reagoiva partikkelitausta canvasilla
- Navigaatio korostaa näkyvissä olevan osion
- Footer ja tietosuojaseloste

## Arkkitehtuuri

```
public/          kopioidaan buildissa sellaisenaan dist-kansioon
  img/           kuvat ja somekuvakkeet (ei versionhallinnassa)
  video/         video-CV (ei versionhallinnassa)
  .htaccess      palvelimen tietoturvaotsakkeet ja välimuistisäännöt
  contact.php    lomakkeen vastaanotin
  favicon.svg    sivuston kuvake
  robots.txt     ohjeet hakukoneille
src/
  data/          sisältö: esittely, projektit, CV
  components/    osiot, modaali ja niiden tyylit
  main.jsx       sovelluksen käynnistys, fontit ja liikkeen vähennysasetus
  App.jsx        sivun rakenne ja yhteinen tila
  index.css      väripaletti, typografia, perustyylit
  App.css        yhteiset rakennuspalat (osiot, napit, tunnisteet)
```

`npm run build` tuottaa `dist/`-kansion, joka viedään palvelimelle. Vite kokoaa JavaScriptin, CSS:n ja fontit `dist/assets/`-kansioon tiedostoiksi, joiden nimessä on sisältötiiviste. Siksi palvelin voi välimuistittaa ne pitkäksi aikaa, ja uusi versio saa aina uuden nimen.

**Sisältö on erotettu komponenteista.** Kaikki tekstit, projektit ja CV:n tiedot ovat `src/data/`-tiedostoissa tavallisina JavaScript-olioina. Uusi projekti lisätään yhdellä oliolla, eikä komponentteihin tarvitse koskea. Komponentit päättelevät esitystavan datasta: esimerkiksi YouTube-linkistä tulee traileri-nappi ja muista linkeistä sivustolinkki.

**Yksi yhteinen modaali** (`Modal.jsx`) palvelee trailereita, video-CV:tä, CV:tä, sertifikaatteja ja tietosuojaselostetta. Se renderöidään portaalilla suoraan `body`-elementtiin, sulkeutuu Esc-näppäimellä, palauttaa fokuksen ja estää taustan rullauksen.

**Suorituskyky:** hiiren liikkeeseen reagoivat animaatiot käyttävät motionin motion value -arvoja, jotka päivittävät tyylejä ilman Reactin uudelleenrenderöintiä. Taustan canvas-animaatio pysähtyy, kun välilehti ei ole näkyvissä.

## Saavutettavuus

- Toiminnot käytettävissä näppäimistöllä, näkyvä fokuskorostus
- Ruudunlukija lukee animoidut otsikot kokonaisina sanoina, ja koristeet on piilotettu siltä
- "Vähennä liikettä" -käyttöjärjestelmäasetus pysäyttää animaatiot
- Automaattisesti vaihtuvat esittelyteksti ja projektit voi pysäyttää napista
- Pääpainikkeiden kosketusalueet vähintään 44 × 44 px

## Responsiivisuus

Asettelu on testattu desktopilla, tabletilla sekä puhelimella pysty- ja vaakatilassa. Mobiilissa navigaatio muuttuu koko ruudun valikoksi, ja videot sekä projektikuvat mitoittuvat matalalle näytölle.

## Tietoturva ja yksityisyys

- **Sisällön tietoturvakäytäntö (CSP):** selain lataa vain sivuston omia tiedostoja ja YouTube-upotuksen, joten ulkopuolista koodia ei voi ajaa sivulla
- **Tietoturvaotsakkeet:** pakotettu HTTPS-yhteys, sivua ei voi upottaa toiselle sivustolle huijaustarkoituksessa, eikä selain saa arvata tiedostojen tyyppiä sisällön perusteella
- **Lomakkeen suojaukset:**
  - tiedot tarkistetaan palvelimella, ei pelkästään selaimessa
  - piilotettu ansakenttä paljastaa botit, jotka täyttävät kaikki kentät
  - liian nopeasti täytetty lomake hylätään
  - samasta osoitteesta voi lähettää yhden viestin minuutissa
  - viestiin ei voi lisätä omia vastaanottajia
  - palvelin hyväksyy viestit vain sivuston omalta lomakkeelta, ei muilta sivustoilta eikä suoraan skripteillä
  - liian suuret pyynnöt hylätään
- Ei evästeitä, analytiikkaa eikä ulkoisia fontteja
- YouTube-upotus ladataan vasta, kun kävijä käynnistää videon, ja se käyttää yksityisyyttä parantavaa tilaa
- Repossa ei ole salaisuuksia

## Paikallinen käyttö

```bash
npm install
npm run dev
```

Muut komennot:

```bash
npm run lint      # koodin tarkistus
npm run build     # tuotantoversio dist-kansioon
npm run preview   # tuotantoversion esikatselu
```

Kuvat ja video-CV eivät ole versionhallinnassa. Ilman niitä sivu toimii, mutta kuvat puuttuvat.

Lomake tarvitsee PHP:n. Paikallisesti sen saa toimimaan käynnistämällä PHP:n sisäänrakennetun palvelimen (`php -S localhost:8000 -t public`), jolloin Viten kehityspalvelin ohjaa lomakkeen pyynnöt sille. Lisäksi `http://localhost:5173` pitää lisätä väliaikaisesti `contact.php`:n sallittuihin osoitteisiin.