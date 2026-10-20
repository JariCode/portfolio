<?php
// ═══════════════════════════════════════════════════════════
// Yhteydenottolomakkeen vastaanotin (Domainhotelli, PHP mail())
// Lomake lähettää JSON-muotoisen POST-pyynnön, vastaus on JSONia.
// Ei evästeitä: lähetystahtia rajoitetaan IP-osoitteen tiivisteellä.
// ═══════════════════════════════════════════════════════════

const TO_EMAIL     = 'jari.karri@elisanet.fi';  // minne viestit tulevat
const FROM_EMAIL   = 'noreply@jaricode.fi';     // oman domainin osoite, muuten viesti päätyy roskapostiin
const MIN_SECONDS  = 3;                         // lomaketta ei voi täyttää nopeammin (botit)
const WAIT_SECONDS = 60;                        // samasta osoitteesta kerran minuutissa
const MAX_BODY     = 10000;                     // pyynnön enimmäiskoko tavuina

// Virheilmoitukset eivät saa tulostua vastaukseen (rikkoisi JSONin ja paljastaisi palvelimen tietoja)
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function respond(int $status, bool $ok, string $message): void {
    http_response_code($status);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

// Vain POST
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Vain POST-pyynnöt sallittu.');
}

// Vain JSON
if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
    respond(415, false, 'Virheellinen pyyntö.');
}

// Pyynnön pitää tulla omalta sivulta. Selain lähettää Originin aina POST-pyynnössä,
// joten puuttuva tai vieras Origin tarkoittaa skriptiä tai toista sivustoa.
const ALLOWED_ORIGINS = ['https://jaricode.fi', 'https://www.jaricode.fi'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origin, ALLOWED_ORIGINS, true)) {
    respond(403, false, 'Pyyntö estetty.');
}

// Liian iso pyyntö hylätään ennen käsittelyä
$raw = file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === false || strlen($raw) > MAX_BODY) {
    respond(413, false, 'Viesti on liian pitkä.');
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    respond(400, false, 'Virheellinen pyyntö.');
}

// Hunajapurkki: ihminen ei näe tätä kenttää, botti täyttää sen.
// Vastataan "onnistui", jottei botti opi kiertämään tarkistusta.
if (!empty($data['website'])) {
    respond(200, true, 'Viesti lähetetty.');
}

// Liian nopea täyttö = todennäköisesti botti
$startedAt = (int) ($data['startedAt'] ?? 0);
if ($startedAt <= 0 || (time() * 1000 - $startedAt) < MIN_SECONDS * 1000) {
    respond(400, false, 'Lomake lähetettiin liian nopeasti. Yritä uudelleen.');
}

// Lähetystahdin rajoitus: IP-osoitteesta tallennetaan vain tiiviste (hash),
// ja merkintä poistetaan, kun odotusaika on kulunut.
$ipHash   = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . __FILE__);
$lockFile = sys_get_temp_dir() . '/jaricode_contact_' . $ipHash;
if (is_file($lockFile)) {
    if (time() - filemtime($lockFile) < WAIT_SECONDS) {
        respond(429, false, 'Odota hetki ennen seuraavaa viestiä.');
    }
    @unlink($lockFile);
}

// Siivous: rivinvaihdot pois nimestä ja sähköpostista (estää otsakeinjektion)
$name    = trim(preg_replace('/[\r\n]+/', ' ', (string) ($data['name'] ?? '')));
$email   = trim(preg_replace('/[\r\n]+/', '', (string) ($data['email'] ?? '')));
$message = trim((string) ($data['message'] ?? ''));

if (mb_strlen($name) < 2 || mb_strlen($name) > 80) {
    respond(422, false, 'Tarkista nimi.');
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || mb_strlen($email) > 120) {
    respond(422, false, 'Tarkista sähköpostiosoite.');
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 3000) {
    respond(422, false, 'Viestin pituuden pitää olla 10–3000 merkkiä.');
}

$subject = 'Yhteydenotto jaricode.fi: ' . $name;
$body = "Nimi: $name\nSähköposti: $email\n\n$message\n";

$headers = implode("\r\n", [
    'From: JariCode <' . FROM_EMAIL . '>',
    'Reply-To: ' . $email,             // "Vastaa" vastaa suoraan lähettäjälle
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
]);

// Ääkköset otsikossa vaativat koodauksen
$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';

if (!mail(TO_EMAIL, $encodedSubject, $body, $headers, '-f' . FROM_EMAIL)) {
    respond(500, false, 'Viestin lähetys epäonnistui. Yritä myöhemmin uudelleen.');
}

@touch($lockFile);
respond(200, true, 'Viesti lähetetty.');