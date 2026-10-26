# JariCode – Portfolio

Portfoliosivusto, joka kokoaa esittelyn, projektit, CV:n ja yhteydenottolomakkeen yhdelle sivulle. Erillisellä pelialueella on selaimessa pelattavia pelejä. Ulkoasu on neonvaloinen yökaupunki: hehkuvat neonputket, HUD-kehykset ja animaatiot, jotka reagoivat kävijän liikkeisiin.

**Sivusto:** https://jaricode.fi/

## Tekniikka

| Osa-alue | Ratkaisu |
|---|---|
| Käyttöliittymä | React 19 |
| Kehitys ja build | Vite (monisivutila: etusivu ja pelialue) |
| Animaatiot | [motion](https://motion.dev/) |
| Tyylit | CSS: muuttujat, grid, `clamp()`, jokaisella komponentilla oma tyylitiedosto |
| Fontit | Fontsource-npm-paketit, ladataan omalta palvelimelta |
| Pelimoottori | [Phaser 4](https://phaser.io/) (Arcade-fysiikka, tilemap) |
| Pelikartat | [Tiled](https://www.mapeditor.org/) |
| Pelien äänet | Web Audio API |
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

### Pelialue (`/pelit/`)
Kolme selaimessa pelattavaa peliä. Z-Runner on valmis, kaksi muuta ovat tulossa.

- **Z-Runner:** tasohyppely neonvaloisessa yökaupungissa (valmis)
- **Space Driver 2026:** pystysuuntainen avaruusammuskelu (tulossa)
- **Shadow Builder:** kaupunginrakennus (tulossa)

Peli käynnistyy samalle sivulle pelinäkymään, eikä kävijää ohjata muualle. Pelin koodi ladataan vasta, kun peli avataan, joten se ei hidasta sivun latautumista. Pelinäkymän muoto tulee pelin kuvasuhteesta: pystysuuntainen ammuskelu ja vaakasuuntainen tasohyppely mahtuvat kumpikin kerralla näytölle. Jos peli kaatuu, virhe näkyy pelinäkymässä ja muu sivu toimii normaalisti.

### Z-Runner
Zombitasohyppely kolmessa maailmassa: pelaaja pakenee yön yli kaupungin halki ja pääsee lopulta karkuun autolla.

- **Maailmat:**
  1. **Neonkatu:** katot, katokset ja kuopat
  2. **Metrotunneli:** laiturit ja huoltotasot; ohi kiitävä juna, josta varoitetaan etukäteen
  3. **Puisto:** puiden latvukset, lampi ja leikkipuisto; maalissa odottaa pakoauto
- **Pelattavuus:** juoksu, hyppy (lyhyt painallus = matala hyppy), lyönti ja päälle hyppy. Zombit partioivat, huomaavat pelaajan ja jahtaavat sitä, mutta eivät kävele kuoppiin. Lapsizombit ovat nopeampia mutta kestävät vähemmän.
- **Kerättävät:** valopallot pisteiksi ja energiapakkaukset lisäenergiaksi. Energia ja pisteet siirtyvät maailmasta toiseen.
- **Pisteet:** valopallot, kaadetut zombit ja aikabonus. Paras tulos tallennetaan ennätykseksi.
- **Välianimaatiot:** alkuanimaatio, laskeutuminen metroon ja nousu metrosta puistoon. Kaikki on piirretty SVG:llä ja CSS-animaatioilla, ja ne voi ohittaa.
- **Lopputekstit:** kuvakulma auton sisältä yöllä kaupungissa ajaessa. Tekijät luetaan tiedostosta `credits.js`.
- **Äänet:** taustamusiikki, efektit ja mykistys (nappi tai M-näppäin). Ääni alkaa vasta Aloita peli -painalluksesta, koska selaimet estävät automaattisen äänen.
- **Ohjaus:** nuolet tai A/D, hyppy ylänuolella, W:llä tai välilyönnillä, lyönti X:llä tai K:lla. Puhelimella ruudulle tulevat kosketusnapit.
- **Rakenne:** kartat on piirretty Tiledissä kolmelle tasolle (Tausta, Maasto, Edusta). Kaikki tilesetit noudattavat samaa laattajärjestystä, joten törmäyssäännöt toimivat jokaisessa maailmassa ilman muutoksia. Taustan parallaksikerrokset, juna, auto ja kerättävät piirretään koodilla canvasille.

### Muuta
- Hiireen reagoiva partikkelitausta canvasilla
- Navigaatio korostaa näkyvissä olevan osion tai sivun ja vie pelialueelta suoraan etusivun oikeaan osioon
- Footer ja tietosuojaseloste molemmilla sivuilla

## Arkkitehtuuri

```
index.html       etusivu
pelit/
  index.html     pelialue (osoite /pelit/)
public/          kopioidaan buildissa sellaisenaan dist-kansioon
  img/           kuvat ja somekuvakkeet (ei versionhallinnassa)
  video/         video-CV (ei versionhallinnassa)
  games/         pelien kuvat: tilesetit ja sprite-arkit (ei versionhallinnassa)
  audio/         pelien äänet ja musiikki (ei versionhallinnassa)
  .htaccess      palvelimen tietoturvaotsakkeet ja välimuistisäännöt
  contact.php    lomakkeen vastaanotin
  favicon.svg    sivuston kuvake
  robots.txt     ohjeet hakukoneille
src/
  data/          sisältö: esittely, projektit, CV, pelit ja navigaation linkit
  components/    osiot, pelialue, modaali ja niiden tyylit
  pages/         pelialueen käynnistys ja sivun rakenne
  games/
    zrunner/     Z-Runner: pelikenttä (Phaser), välianimaatiot, äänet, kartat (maps/) ja tekijät
  main.jsx       etusivun käynnistys, fontit ja liikkeen vähennysasetus
  App.jsx        etusivun rakenne ja yhteinen tila
  index.css      väripaletti, typografia, perustyylit
  App.css        yhteiset rakennuspalat (osiot, napit, tunnisteet)
```

`npm run build` tuottaa `dist/`-kansion, joka viedään palvelimelle. Vite kokoaa JavaScriptin, CSS:n ja fontit `dist/assets/`-kansioon tiedostoiksi, joiden nimessä on sisältötiiviste. Siksi palvelin voi välimuistittaa ne pitkäksi aikaa, ja uusi versio saa aina uuden nimen.

**Kaksi sivua, yhteiset komponentit.** Etusivu ja pelialue ovat Viten monisivutilassa omia HTML-sivujaan, joilla on kummallakin oma käynnistystiedosto. Navigaatio, footer, tausta ja modaali ovat yhteisiä, ja ne saavat tiedon sivusta propina. Etusivun osiot eivät lataudu pelialueelle, eikä pelien koodi lataudu etusivulle.

**Sisältö on erotettu komponenteista.** Kaikki tekstit, projektit, CV:n tiedot ja pelit ovat `src/data/`-tiedostoissa tavallisina JavaScript-olioina. Uusi projekti lisätään yhdellä oliolla, eikä komponentteihin tarvitse koskea. Komponentit päättelevät esitystavan datasta: esimerkiksi YouTube-linkistä tulee traileri-nappi ja muista linkeistä sivustolinkki. Navigaation linkit ovat yhdessä tiedostossa, josta sekä navi että footer ne lukevat. Samoin Z-Runnerin maailmat ovat yhdessä listassa (`worlds.js`): uusi maailma on kartta ja yksi olio.

**Yksi yhteinen modaali** (`Modal.jsx`) palvelee trailereita, video-CV:tä, CV:tä, sertifikaatteja, tietosuojaselostetta ja pelejä. Se renderöidään portaalilla suoraan `body`-elementtiin, sulkeutuu Esc-näppäimellä, palauttaa fokuksen ja estää taustan rullauksen.

**Suorituskyky:** hiiren liikkeeseen reagoivat animaatiot käyttävät motionin motion value -arvoja, jotka päivittävät tyylejä ilman Reactin uudelleenrenderöintiä. Taustan canvas-animaatio pysähtyy, kun välilehti ei ole näkyvissä. Pelit ladataan erillisinä paloina vasta avattaessa, ja Phaser esiladataan alkuanimaation aikana. Pelien taustakerrokset piirretään kerran tekstuureiksi, joita pelin aikana vain siirretään.

## Saavutettavuus

- Toiminnot käytettävissä näppäimistöllä, näkyvä fokuskorostus
- Ruudunlukija lukee animoidut otsikot kokonaisina sanoina, ja koristeet on piilotettu siltä
- "Vähennä liikettä" -käyttöjärjestelmäasetus pysäyttää animaatiot ja ohittaa pelin välianimaatiot
- Automaattisesti vaihtuvat esittelyteksti ja projektit voi pysäyttää napista
- Pelin avautuessa fokus siirtyy pelinäkymään, ja suljettaessa se palaa pelin korttiin
- Pelin animaatiot voi ohittaa näppäimistöllä (Ohita-nappi saa fokuksen)
- Pääpainikkeiden kosketusalueet vähintään 44 × 44 px

## Responsiivisuus

Asettelu on testattu desktopilla, tabletilla sekä puhelimella pysty- ja vaakatilassa. Mobiilissa navigaatio muuttuu koko ruudun valikoksi, ja videot sekä projektikuvat mitoittuvat matalalle näytölle. Pelialue mahtuu tavallisella näytöllä footereineen kerralla näkyviin. Peli skaalautuu pelinäkymään kuvasuhteensa mukaan, ja kosketusnäytöillä näkyvät ohjausnapit.

## Tietoturva ja yksityisyys

- **Sisällön tietoturvakäytäntö (CSP):** selain lataa vain sivuston omia tiedostoja ja YouTube-upotuksen, joten ulkopuolista koodia ei voi ajaa sivulla. Käytäntö koskee sekä etusivua että pelialuetta. Pelimoottori on asetettu lataamaan kuvat ja äänet tavalla, joka toimii tiukan käytännön kanssa.
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
- Pelit toteutetaan kokonaan selaimessa: ei palvelinta, ei API-avaimia eikä ulkoisia lähteitä
- Pelit tallentavat vain ennätyksen selaimen omaan muistiin (`localStorage`, avaimet muotoa `jaricode:<peli>:<nimi>`). Tallennus tehdään vasta pelatessa, ja pelin lopussa olevalla Tyhjennä tallennukset -napilla sen saa poistettua. Äänten mykistys on vain muistissa, eikä sitä tallenneta.
- YouTube-upotus ladataan vasta, kun kävijä käynnistää videon, ja se käyttää yksityisyyttä parantavaa tilaa
- Repossa ei ole salaisuuksia

## Tekijät ja lisenssit

Kuva- ja äänitiedostot eivät ole versionhallinnassa, eikä niitä jaeta erikseen. Ne ovat käytössä vain pelien osana. Jokaisen pelin tekijät ovat myös pelin omassa `credits.js`-tiedostossa.

Musiikin ja äänten lähde on [Pixabay](https://pixabay.com/) ja lisenssi [Pixabay Content License](https://pixabay.com/service/license-summary/): käyttö ja muokkaus sallittu, tekijän mainintaa ei vaadita. Osa Pixabayn musiikista on rekisteröity YouTuben Content ID -järjestelmään. Sivustolla se ei haittaa, mutta jos kappaletta käytetään YouTube-videolla, YouTube voi tehdä tekijänoikeusilmoituksen, jonka voi kiistää lisenssin perusteella.

### Z-Runner

Peli, tarina ja juoni sekä kartat ovat Jari Karrin. Tilesetit, taustat ja animaatiot on piirretty koodilla Clauden (Anthropic) kanssa. Tekijät: `src/games/zrunner/credits.js`, josta pelin lopputekstit luetaan.

**Hahmot (sprite-arkit).** Lisenssi: [CraftPix File License](https://craftpix.net/file-licenses/). Kaupallinen käyttö ja muokkaus sallittu, tekijän mainintaa ei vaadita. Ruudut on kohdistettu, skaalattu ja koottu sprite-arkeiksi.

| Käyttö | Paketti | Tekijä | Lähde |
|---|---|---|---|
| Pelaaja | Free Medieval Bandit 4-Direction Character Pack (Thug) | CraftPix.net | [craftpix.net](https://craftpix.net/freebies/free-medieval-bandit-4-direction-character-pack/) |
| Aikuiset zombit | 2D Zombie Free Sprite | CraftPix.net | [craftpix.net](https://craftpix.net/freebies/2d-game-zombie-character-free-sprite-pack-1/) |
| Lapsizombit | 2D Zombie Kids Free Sprite | CraftPix.net | [craftpix.net](https://craftpix.net/freebies/2d-game-zombie-kids-character-free-sprite-8/) |

**Musiikki ja äänet** (Pixabay, `public/audio/zrunner/`). Taustamusiikki ja intro on rekisteröity Content ID:hen.

| Käyttö | Tiedosto | Nimi Pixabayssa | Tekijä |
|---|---|---|---|
| Taustamusiikki | `musiikki.mp3` | Instrumental Synthwave Background Music | UsefulPix |
| Alku- ja välianimaatiot | `intro.mp3` | Intro Opening Titles Music | alex-morgan |
| Zombin kaatuminen | `zombi-kuolee.mp3` | Man death scream | u_r7cny11q7r |
| Pelaajan lyönti | `lyonti.mp3` | Punch | Universfield |
| Osuma pelaajaan | `osuma.mp3` | young man being hurt | pepsimanfan (Freesound), julkaisija freesound_community |
| Zombi huomaa pelaajan | `zombi-hyokkaa.mp3` | Scary Scream | DRAGON-STUDIO |
| Metron juna | `juna.mp3` | Train #1 | Phoenix_Connection_Brazil |
| Valopallon keräys | `keraa.mp3` | collect | Wagna (Freesound), julkaisija freesound_community |
| Osuma zombiin | `zombi-osuma.mp3` | Impact Thud | Universfield |
| Pakoauto ja lopputekstit | `auto.mp3` | Inside Car (Driving) | Fabrizio84 (Freesound), julkaisija freesound_community |

### Space Driver 2026

Peli ja sektorien kartat ovat Jari Karrin. Asteroidikentän tileset, HUD ja animaatiot on piirretty koodilla Clauden (Anthropic) kanssa. Tekijät: `src/games/spacedriver/credits.js`.

**Alukset ja tehostimet (sprite-arkit).** Void-sarja, piirtäjä Baldur, julkaisija Foozle. Lisenssi: [CC0](https://creativecommons.org/publicdomain/zero/1.0/), eli vapaa käyttö ilman ehtoja. Valitut tiedostot on nimetty uudelleen, muuten ne ovat sellaisenaan.

| Käyttö | Paketti | Lähde |
|---|---|---|
| Pelaajan alus | Void – Main Ship | [itch.io](https://foozlecc.itch.io/void-main-ship) |
| Vihollislaivasto 1 | Void – Fleet Pack 1 | [itch.io](https://foozlecc.itch.io/void-fleet-pack-1) |
| Vihollislaivasto 2 | Void – Fleet Pack 2 | [itch.io](https://foozlecc.itch.io/void-fleet-pack-2) |
| Vihollislaivasto 3 | Void – Fleet Pack 3 | [itch.io](https://foozlecc.itch.io/void-fleet-pack-3) |
| Tehostimet | Void – Pickups Pack | [itch.io](https://foozlecc.itch.io/void-pickups-pack) |

**Musiikki ja äänet** (Pixabay, `public/audio/spacedriver/`). Taistelumusiikki ja intro on rekisteröity Content ID:hen.

| Käyttö | Tiedosto | Nimi Pixabayssa | Tekijä |
|---|---|---|---|
| Taistelumusiikki (silmukka) | `musiikki.mp3` | Feel This Energy (Voyager) | AlexGrohl |
| Pomotaistelu (silmukka) | `pomo.mp3` | Free Boss Fight Loop | C0mp0s3r69 |
| Alkuanimaatio | `intro.mp3` | Space Ambient Music | Onetent |
| Pelaajan ammus | `ammus.mp3` | laser shot ingame | RibhavAgrawal |
| Vihollisen ja pomon ammus | `vihollisen-ammus.mp3` | Laser zap | Hoscalegeek (Freesound), julkaisija freesound_community |
| Osuma alukseen ja viholliseen | `osuma.mp3` | Metal Hit 12 | floraphonic |
| Vihollisen räjähdys | `rajahdys.mp3` | Explosion | morganpurkis (Freesound), julkaisija freesound_community |
| Pommi | `pommi.mp3` | Medium Explosion | JuveriSetila (Freesound), julkaisija freesound_community |
| Tehostimen keräys | `tehostin.mp3` | Win | Musheran |
| Hyperhyppy | `hyperhyppy.mp3` | Hyper-Drive Spaceship Flyby | SoundShelfStudio |

## Paikallinen käyttö

```bash
npm install
npm run dev
```

Etusivu aukeaa osoitteessa `http://localhost:5173/` ja pelialue osoitteessa `http://localhost:5173/pelit/`.

Muut komennot:

```bash
npm run lint      # koodin tarkistus
npm run build     # tuotantoversio dist-kansioon
npm run preview   # tuotantoversion esikatselu
```

Kuvat, video-CV sekä pelien kuvat ja äänet eivät ole versionhallinnassa. Ilman niitä sivu toimii, mutta kuvat puuttuvat ja pelit ovat äänettömiä.

Lomake tarvitsee PHP:n. Paikallisesti sen saa toimimaan käynnistämällä PHP:n sisäänrakennetun palvelimen (`php -S localhost:8000 -t public`), jolloin Viten kehityspalvelin ohjaa lomakkeen pyynnöt sille. Lisäksi `http://localhost:5173` pitää lisätä väliaikaisesti `contact.php`:n sallittuihin osoitteisiin.