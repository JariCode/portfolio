// Isometrinen projektio: ruudukon piste (x, y, korkeus z) näytön koordinaateiksi.
// Yhteinen ruudukolle, rakennuksille ja valikon kuvakkeille.

// Ruudun puolileveys ja -korkeus näytöllä sekä yhden korkeusyksikön pituus
export const TW = 40;
export const TH = 20;
export const ZU = 40;

export const iso = (x, y, z = 0) => [(x - y) * TW, (x + y) * TH - z * ZU];