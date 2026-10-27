// Vartijan repliikit. Jokainen näytetään kerran, kun sen ehto täyttyy; järjestys ratkaisee,
// jos monta ehtoa täyttyy yhtä aikaa. after: repliikki tulee vasta tietyn toisen jälkeen,
// jotta ohjeet etenevät askel kerrallaan.
//
// s on pelin tilanne (Game.jsx, stats): rakennusten määrät, tieyhteydet, varjot, valo,
// raha, sähkö, päivä, luku ja valittu työkalu. Tekstit eivät puhu klikkaamisesta tai
// napauttamisesta: sama teksti käy hiirelle ja sormelle.

export const LINES = [
  // ── Luku 1: ensimmäiset askeleet ──
  {
    id: 'start',
    mood: 'rauhallinen',
    when: () => true,
    text: 'Tämä maa muistaa kaupungin. Kaikki alkaa raatihuoneelta, keskeltä.',
  },
  {
    id: 'road',
    after: 'start',
    mood: 'rauhallinen',
    when: (s) => s.road === 0,
    text: 'Vedä ensin tie raatihuoneen viereen. Valitse alhaalta Tie ja rakenna se ruutuun.',
  },
  {
    id: 'house',
    after: 'start',
    mood: 'iloinen',
    when: (s) => s.road > 0 && s.house === 0,
    text: 'Hyvä. Nyt talo tien varteen. Asukkaat tarvitsevat kodin.',
  },
  {
    id: 'lost',
    mood: 'huolissaan',
    when: (s) => s.unlinked > 0,
    text: 'Tuo rakennus jäi irralleen. Ilman tietä raatihuoneelle se ei toimi.',
  },
  {
    id: 'firstLight',
    mood: 'iloinen',
    when: (s) => s.linkedHouse > 0,
    text: 'Ensimmäinen ikkuna syttyi. Asukkaat muuttavat taloon yön aikana.',
  },
  {
    id: 'growth',
    after: 'firstLight',
    mood: 'rauhallinen',
    when: (s) => s.house > 0,
    text: 'Talo kasvaa kaksi asukasta yössä. Nurmi viereen, puisto kahden ruudun päähän ja kauppa kolmen ruudun päähän lisäävät kukin yhden.',
  },
  {
    id: 'range',
    after: 'growth',
    mood: 'rauhallinen',
    when: (s) => ['grass', 'park', 'shop'].includes(s.tool),
    text: 'Hehkuvat ruudut näyttävät, mihin asti vaikutus ulottuu. Talojen päällä näet, paljonko niiden kasvu nopeutuu.',
  },
  {
    id: 'firstDay',
    after: 'firstLight',
    mood: 'rauhallinen',
    when: (s) => s.day >= 2,
    text: 'Yö vaihtui. Joka keskiyö asukkaat maksavat veronsa ja taloihin muuttaa lisää väkeä.',
  },
  {
    id: 'rotate',
    after: 'firstLight',
    mood: 'rauhallinen',
    when: (s) => s.house > 0,
    text: 'Talot kääntävät ovensa kohti tietä. Jos haluat toisin, käännä rakennusta ennen kuin rakennat.',
  },
  {
    id: 'solar',
    after: 'firstLight',
    mood: 'rauhallinen',
    when: (s) => s.solar === 0 && s.house >= 2,
    text: 'Talot tarvitsevat sähköä, kukin kaksi. Valokenno tuottaa jopa kuusi, kunhan mikään ei varjosta sitä.',
  },
  {
    id: 'dark',
    mood: 'huolissaan',
    when: (s) => s.dark,
    text: 'Sähkö ei riitä. Talot pimenevät, ja pimeästä talosta asukkaat lähtevät. Lisää valokennoja.',
  },
  {
    id: 'shadows',
    after: 'solar',
    mood: 'rauhallinen',
    when: (s) => s.solar > 0,
    text: 'Katso varjoja. Ne kääntyvät valon mukana, ja korkea rakennus heittää pitkän varjon.',
  },
  {
    id: 'solarShade',
    mood: 'huolissaan',
    when: (s) => s.solarShaded > 0,
    text: 'Valokenno jäi varjoon. Varjossa se ei tuota mitään.',
  },
  {
    id: 'night',
    after: 'shadows',
    mood: 'yllattynyt',
    when: (s) => s.night,
    text: 'Kuu nousi. Sen valo heittää himmeämpiä varjoja, eikä kenno saa siitä voimaa.',
  },
  {
    id: 'grass',
    after: 'firstDay',
    mood: 'rauhallinen',
    when: (s) => s.house >= 2 && s.grass === 0,
    text: 'Nurmi talon vieressä tuo yhden asukkaan lisää joka yö. Se maksaa vain viisi euroa.',
  },
  {
    id: 'shop',
    after: 'firstDay',
    mood: 'rauhallinen',
    when: (s) => s.house >= 3 && s.shop === 0,
    text: 'Kauppa tuo kymmenen euroa yössä ja osuuden lähiasukkaista. Talot kolmen ruudun päässä kasvavat nopeammin.',
  },
  {
    id: 'park',
    after: 'shop',
    mood: 'rauhallinen',
    when: (s) => s.shop > 0 && s.park === 0,
    text: 'Puisto nopeuttaa talojen kasvua kahden ruudun päässä, viereisiä kaksin verroin. Myöhemmin se avaa tien kerrostaloille.',
  },
  {
    id: 'poor',
    after: 'firstDay',
    mood: 'huolissaan',
    when: (s) => s.poor && s.buildings > 0,
    text: 'Kassa on lähes tyhjä. Odota yötä: raatihuone tuo aina tuloja, eikä mikään ole lopullista.',
  },
  {
    id: 'demolish',
    after: 'firstDay',
    mood: 'rauhallinen',
    when: (s) => s.buildings >= 6,
    text: 'Väärä paikka? Valitse Pura. Saat puolet hinnasta takaisin.',
  },
  // ── Luku 2: kaupunki ──
  {
    id: 'chapter2',
    mood: 'yllattynyt',
    when: (s) => s.chapter >= 2,
    text: 'Kylästä tuli kaupunki! Talon voi nyt korottaa kerrostaloksi, kunhan puisto on lähellä.',
  },
  {
    id: 'mushroom',
    after: 'chapter2',
    mood: 'rauhallinen',
    when: (s) => s.tower > 0 && s.mushroom === 0,
    text: 'Varjoista on hyötyäkin. Sienitarha tuottaa varjossa jopa 18 euroa yössä. Rakenna se korkean talon taakse.',
  },
  {
    id: 'plant',
    after: 'chapter2',
    mood: 'rauhallinen',
    when: (s) => s.tower >= 2 && s.plant === 0,
    text: 'Kerrostalot janoavat sähköä. Voimala tuottaa sitä yölläkin, mutta sen savu hidastaa talojen kasvua kahden ruudun päässä.',
  },
  // ── Luku 3 ja loppu ──
  {
    id: 'chapter3',
    mood: 'iloinen',
    when: (s) => s.chapter >= 3,
    text: 'Suurkaupunki herää. Tuhat asukasta on enää kivenheiton päässä.',
  },
  {
    id: 'goal',
    mood: 'iloinen',
    when: (s) => s.done,
    text: 'Kaupunki on herännyt. Tuhat valoa palaa taas. Kiitos, rakentaja.',
  },
];

// Seuraava näytettävä repliikki tai null
export function nextLine(stats, seen) {
  return LINES.find((l) => !seen.has(l.id) && (!l.after || seen.has(l.after)) && l.when(stats)) ?? null;
}