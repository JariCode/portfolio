// Vartijan repliikit. Jokainen näytetään kerran, kun sen ehto täyttyy; järjestys ratkaisee,
// jos monta ehtoa täyttyy yhtä aikaa. after: repliikki tulee vasta tietyn toisen jälkeen,
// jotta ohjeet etenevät askel kerrallaan.
//
// s on pelin tilanne (Game.jsx, stats): rakennusten määrät, tieyhteydet, varjot ja valo.
// Tekstit eivät puhu klikkaamisesta tai napauttamisesta: sama teksti käy hiirelle ja sormelle.

export const LINES = [
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
    text: 'Tuo rakennus jäi irralleen. Ilman tietä raatihuoneelle sen valot eivät syty.',
  },
  {
    id: 'firstLight',
    mood: 'iloinen',
    when: (s) => s.linkedHouse > 0,
    text: 'Ensimmäinen ikkuna syttyi. Kaupunki muistaa valonsa.',
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
    when: (s) => s.solar === 0,
    text: 'Talot tarvitsevat sähköä. Valokenno kerää valoa, kunhan mikään ei varjosta sitä.',
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
    id: 'solarLit',
    after: 'shadows',
    mood: 'iloinen',
    when: (s) => s.solarLit > 0,
    text: 'Kenno hehkuu. Valo on puolellamme.',
  },
  {
    id: 'night',
    after: 'shadows',
    mood: 'yllattynyt',
    when: (s) => s.night,
    text: 'Kuu nousi. Sen valo heittää himmeämpiä varjoja, eikä kenno saa siitä voimaa.',
  },
  {
    id: 'shop',
    after: 'firstLight',
    mood: 'rauhallinen',
    when: (s) => s.house >= 3 && s.shop === 0,
    text: 'Asukkaat kaipaavat kauppaa. Sen neonkyltti näkyy kauas.',
  },
  {
    id: 'park',
    after: 'shop',
    mood: 'rauhallinen',
    when: (s) => s.shop > 0 && s.park === 0,
    text: 'Puisto tuo viihtyvyyttä. Puidenkin varjot ovat varjoja.',
  },
  {
    id: 'demolish',
    after: 'firstLight',
    mood: 'rauhallinen',
    when: (s) => s.buildings >= 6,
    text: 'Väärä paikka? Valitse Pura. Mikään ei ole lopullista.',
  },
  {
    id: 'village',
    after: 'park',
    mood: 'iloinen',
    when: (s) => s.buildings >= 12,
    text: 'Kylä herää. Pian tarvitsemme rahaa ja sähköä, mutta se on huomisen tarina.',
  },
];

// Seuraava näytettävä repliikki tai null
export function nextLine(stats, seen) {
  return LINES.find((l) => !seen.has(l.id) && (!l.after || seen.has(l.after)) && l.when(stats)) ?? null;
}