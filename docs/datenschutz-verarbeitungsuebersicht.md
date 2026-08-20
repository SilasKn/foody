# Datenverarbeitungs-Übersicht „foody" — Input für die Datenschutzerklärung

*Stand: 14.08.2026 · Codebasis-Stand: Commit `122c9f0` · App-Version 1.0.3*

## Zweck dieses Dokuments

Die bestehende Datenschutzerklärung unter `website/privacy-policy/index.html` wird komplett ersetzt. Dieses Dokument ist die Grundlage dafür: eine strukturierte Übersicht aller tatsächlich stattfindenden Verarbeitungen, die als Input an eine schreibende Instanz (KI oder Jurist) übergeben werden kann. Grundlage ist eine vollständige Durchsicht von `apps/mobile/`, `supabase/`, `website/` sowie `package.json`/`app.config.js`/`eas.json`/`netlify.toml`.

Es ersetzt keine Rechtsberatung. Die in §5 gelisteten offenen Punkte sind vor der Veröffentlichung zu klären.

---

## 0. Verantwortlicher

| Feld | Wert | Quelle |
|---|---|---|
| Verantwortlicher (Art. 4 Nr. 7 DSGVO) | Silas Knapp, Rosenweg 6/2, 72581 Dettingen, Deutschland — natürliche Person, kein Unternehmen | `apps/mobile/screens/ImprintScreen.js:55-58` |
| Kontakt | service@foodytheapp.com | `ImprintScreen.js:62` |
| Datenschutzbeauftragter | nicht bestellt (nicht erforderlich, Art. 37 DSGVO) | — |
| Zuständige Aufsichtsbehörde | LfDI Baden-Württemberg (Wohnsitz Dettingen/Erms) | abgeleitet |
| App | „foody", iOS Bundle `com.silasknapp.foody`, Version 1.0.3 | `app.config.js:4,18` |
| Website | https://foodytheapp.com (statisch, Netlify) | `website/netlify.toml`, `eas.json` |

> **Achtung für die Erklärung:** Die alte Fassung nennt den Verantwortlichen nur als „foody" (Produktname, keine Rechtsperson) und verwendet an 5 Stellen `siknago@gmail.com` statt der Impressums-Adresse. Beides ist zu korrigieren — Art. 13 Abs. 1 lit. a DSGVO verlangt Identität **und** Anschrift.

---

## 1. Verarbeitungstätigkeiten

Legende Rechtsgrundlage: **(b)** = Art. 6 Abs. 1 lit. b (Vertragserfüllung), **(f)** = lit. f (berechtigtes Interesse), **(a)** = lit. a (Einwilligung), **(c)** = lit. c (rechtliche Verpflichtung).

| # | Verarbeitung / Zweck | Konkrete Datenkategorien | Herkunft | Rechts­grundlage | Speicherort / Empfänger | Speicherdauer & Löschung | Sichtbar für Dritte? |
|---|---|---|---|---|---|---|---|
| 1 | **Registrierung eines Nutzerkontos** — ohne Konto ist die App nicht nutzbar | E-Mail-Adresse; Passwort (serverseitig gehasht, bcrypt via Supabase Auth); frei gewählter Anzeigename (`display_name` in `raw_user_meta_data`), **Pflichtangabe** bei der Registrierung; Zeitstempel (`created_at`) | Eingabe des Nutzers | (b) — Anzeigename ist Pflichtbestandteil der Kontoeinrichtung | Supabase `auth.users` | Bis zur Kontolöschung durch den Nutzer | Nein |
| 2 | **Automatische Profilanlage** — Anzeigename für die Autorenanzeige | `profiles.user_id` (UUID), `profiles.username` — **eindeutig**, Groß-/Kleinschreibung wird ignoriert | DB-Trigger `handle_new_user` beim Signup | (b) | Supabase `public.profiles` | Cascade-Löschung bei Kontolöschung | **Ja** — `username` wird anderen Nutzern als Autor öffentlicher Rezepte angezeigt |
| 3 | **Verfügbarkeitsprüfung des Anzeigenamens** — das Registrierungsformular prüft während der Eingabe, ob ein Name bereits vergeben ist | eingetippter Name-Kandidat (nur transient, wird nicht gespeichert) | Eingabe des Nutzers | (b) — technisch notwendig für die Eindeutigkeit aus #2 | Supabase RPC `is_username_available`, ohne Session aufrufbar | Keine Speicherung; nur Auswertung zur Laufzeit | Nein — die Funktion gibt ausschließlich ja/nein zurück, keine Daten anderer Nutzer |
| 4 | **E-Mail-Verifizierung** | E-Mail-Adresse, Bestätigungs-Token, Redirect auf `https://foodytheapp.com/verify-email` | Supabase Auth | (b), teils (f) Missbrauchsschutz | Supabase Auth + Supabase-Mailversand | Token kurzlebig | Nein |
| 5 | **Login / Sitzungsverwaltung** | E-Mail + Passwort bei Login; Access-Token (JWT), Refresh-Token; `last_sign_in_at` | Eingabe / Supabase Auth | (b) | Supabase Auth; **zusätzlich lokal auf dem Gerät** | Session bis Logout/Kontolöschung; lokal bis Logout oder App-Deinstallation | Nein |
| 6 | **Lokale Sitzungsspeicherung auf dem Gerät** | AsyncStorage-Key `sb-<projectref>-auth-token` mit JWT, Refresh-Token, `expires_at` **und dem vollständigen User-Objekt (ID, E-Mail, Anzeigename, Zeitstempel)** — App-Sandbox, unverschlüsselt, **nicht** iOS Keychain | Supabase SDK | (b) | nur lokal auf dem Endgerät, keine Übermittlung | Bis Logout / Deinstallation | Nein |
| 7 | **Passwortänderung** | Aktuelles + neues Passwort | Eingabe | (b) | Supabase Auth | — | Nein |
| 8 | **Passwort-Zurücksetzen per E-Mail** | E-Mail-Adresse, Recovery-Token, Redirect auf `https://foodytheapp.com/reset-password`; dort neues Passwort | Eingabe | (b) | Supabase Auth + Mailversand; Website-Formular | Token kurzlebig; Recovery-Session wird **nicht persistiert** (`persistSession: false`) und sofort nach Erfolg beendet | Nein |
| 9 | **Rezepte anlegen/bearbeiten** (Kernfunktion) | `name`, `description` (Freitext), `servings`, `created_at`, `author` (User-UUID), `public` (bool), `draft` (bool) | Eingabe | (b) | Supabase `public.recipes` | Bis Löschung durch Nutzer bzw. Cascade bei Kontolöschung | Nur wenn `public = true`; **derzeit setzt die App `public` hart auf `false`, es existiert kein Code-Pfad zum Veröffentlichen** |
| 10 | **Zutaten** | `ingredients.name` (Freitext, vom Nutzer eingegeben), `created_by` (User-UUID) | Eingabe | (b) | Supabase `public.ingredients` — **pro Nutzer getrennte Zeilen mit Eigentümer-Spalte `created_by`**; RLS gibt jedem Nutzer ausschließlich die eigenen Zeilen frei (`auth.uid() = created_by`) | Cascade bei Kontolöschung über `created_by → auth.users` | **Nein** — seit A-6 sieht kein Nutzer den Freitext eines anderen; jede Zutat gehört genau einem Konto |
| 11 | **Zutaten-Zuordnung zum Rezept** | `recipe_id`, `ingredient_id`, `quantity`, `unit` | Eingabe | (b) | Supabase `public.recipe_ingredients` | Cascade mit Rezept/Konto | wie #9 |
| 12 | **Rezeptfotos hochladen** | Bilddatei aus der Fotomediathek; Metadaten: `user_id`, `file_path`, `bucket`, `recipe_id`, `width`, `height`. **Der Dateipfad enthält die User-UUID:** `<user_id>/<recipe_id>/<timestamp>.<ext>` | Fotomediathek des Geräts | (b), alternativ (a) | Supabase Storage Bucket `recipe_images` (**privat**) + Tabelle `public.recipe_images` | Löschung mit dem Rezept (`deleteRecipeImages.js`) bzw. vollständiger Storage-Purge bei Kontolöschung | Zugriff **ausschließlich über zeitlich begrenzte Signed URLs (1 Stunde)**; `getPublicUrl` wird nirgends verwendet. **Keine EXIF-Daten:** Das Bild wird vor dem Upload lokal auf dem Gerät dekodiert und als JPEG neu encodiert (`expo-image-manipulator` in `AddRecipeScreen.js`, `pickImage`); sämtliche EXIF-Metadaten inkl. **GPS-Koordinaten** gehen dabei verloren. **Standortdaten verlassen das Gerät also nicht.** Schlägt das Re-Encoding fehl, wird das Bild verworfen statt ungefiltert hochgeladen. Hinweis: Bilder, die **vor** dieser Änderung hochgeladen wurden, können noch GPS-Tags enthalten |
| 13 | **Essensplanung / Kalender** — **verhaltens- bzw. ernährungsbezogene Daten** | `recipe_id`, `user_id`, `scheduled_for` (Datum), `scheduled_as` (Mahlzeitentyp), `servings` | Eingabe | (b) | Supabase `public.recipe_schedule` | **Automatische Löschung:** vergangene Einträge (`scheduled_for < heute`) werden bei jedem Öffnen des Kalenders gelöscht | Nein |
| 14 | **„Zuletzt gegessen"-Marker für Vorschläge** | `recipes.last_eaten` (Datum) | abgeleitet aus #13 | (b) bzw. (f) Funktionsverbesserung | Supabase `public.recipes` | wie #9 | Nein |
| 15 | **Einkaufsliste / Zutaten-Aggregation („Fridge")** | Aggregation aus #11 + #13 | abgeleitet | (b) | **Berechnung erfolgt lokal in der App** (`utils/aggregateIngredients.js`), keine zusätzliche Speicherung | flüchtig | Nein |
| 16 | **Kontolöschung (Art. 17 DSGVO, self-service)** | User-UUID aus dem JWT des Aufrufers | Nutzeraktion in den Einstellungen | (b) / (c) | Supabase Edge Function `delete-account` | Löscht **rekursiv alle Storage-Objekte unter `<user_id>/`**, verifiziert die Leerung und ruft dann `auth.admin.deleteUser` auf; `profiles`, `recipes`, `ingredients`, `recipe_ingredients`, `recipe_schedule`, `recipe_images` gehen per FK-Cascade mit. Bei Fehler bleibt das Konto absichtlich bestehen (Retry möglich) | — |
| 17 | **Betrieb der Website foodytheapp.com** | Server-Logs des Hosters (IP-Adresse, Zeitstempel, User-Agent, angeforderte Ressource) | automatisch beim Aufruf | (f) — Betrieb & Sicherheit | **Netlify** (US-Anbieter) | nach Netlify-Vorgaben | Nein |
| 18 | **Betrieb der Backend-Infrastruktur** | Serverseitige Logs / Auth-Audit-Logs von Supabase (u. a. IP-Adressen bei Auth-Vorgängen) | automatisch | (f) | **Supabase** | nach Supabase-Vorgaben; **wird bei Kontolöschung nicht mit gelöscht** | Nein |
| 19 | **App-Distribution** | Apple-Account-Daten, Käufe/Downloads, ggf. Absturzberichte auf Apple-Ebene — **nicht vom Betreiber erhoben**, unterliegen Apples eigener Datenschutzerklärung | Apple | — (Apple eigenverantwortlich) | **Apple** (App Store / TestFlight) | Apple | — |

---

## 2. Empfänger / Auftragsverarbeiter

| Dienst | Rolle | Was fließt dorthin | Sitz | Hinweis für die Erklärung |
|---|---|---|---|---|
| **Supabase** (Projekt `ciuojjrpsvjhpxdozhwy`) | Auftragsverarbeiter, Art. 28 | Sämtliche Konto-, Rezept-, Zutaten-, Planungs- und Bilddaten; Auth-Logs; E-Mail-Versand für Verifizierung/Passwort-Reset | **Region aus dem Repo nicht ermittelbar — muss verifiziert werden** | AV-Vertrag nennen; bei Nicht-EU-Region Art. 46 (SCCs) konkret benennen |
| **Netlify** | Auftragsverarbeiter | Website-Auslieferung, Server-Logs mit IP | USA | Fehlt in der alten Erklärung vollständig — ergänzen |
| **Expo / EAS (650 Industries)** | Auftragsverarbeiter (Build-Zeit) | Build-Prozess der App; keine Endnutzerdaten. Kein `expo-updates` installiert → **kein OTA-Kanal, keine Laufzeit-Telemetrie** | USA | Nur erwähnen, wenn Vollständigkeit gewünscht |
| **Apple** | Eigenverantwortlicher | App-Store-Distribution | USA/EU | Verweis auf Apples Datenschutzerklärung |
| **esm.sh (CDN)** | — | Die Edge Function lädt zur Laufzeit `@supabase/supabase-js@2` von `https://esm.sh` | — | Keine Nutzerdaten; Supply-Chain-Hinweis, kein DSGVO-Thema |
| **GitHub** | — | Nur Quellcode, keine Personendaten von Nutzern | USA | Nicht erwähnenswert |

---

## 3. Was ausdrücklich **nicht** stattfindet (verifizierte Negativ-Aussagen)

Diese Punkte sind im Code nachweisbar und sollten aktiv in der Erklärung stehen — sie sind eine starke Compliance-Position:

- **Keine Analytics, kein Tracking, kein Crash-Reporting, keine Werbung.** Kein Sentry, Firebase, Amplitude, PostHog, Mixpanel, Segment, AdMob, RevenueCat, Bugsnag — weder in `package.json` noch in `node_modules` (508 Pakete geprüft).
- **Keine Werbe-IDs / kein Tracking über App-Grenzen hinweg.** Kein IDFA/AAID, kein `expo-tracking-transparency`, kein `expo-device`.
- **Keine Push-Benachrichtigungen, keine Device-Tokens.** `expo-notifications` nicht installiert.
- **Keine Standortdaten, keine Kontakte, kein Kalenderzugriff, kein Mikrofon.** Keine entsprechenden APIs im Code.
- **Kein Kamerazugriff im Code** — nur `launchImageLibraryAsync` (Fotomediathek). *Einschränkung siehe §5, Punkt Android.*
- **Keine Verkäufe oder Weitergabe von Daten an Dritte, kein Profiling, keine automatisierte Entscheidungsfindung** i. S. v. Art. 22 DSGVO.
- **Keine Netzwerkaufrufe außerhalb von Supabase.** Der einzige rohe `fetch` liest eine lokale `file://`-URI zum Auslesen der Bilddatei.
- **Website: keine Cookies, kein LocalStorage-Tracking, keine Analytics, keine eingebetteten Dritten.** Schriftarten sind **selbst gehostet** (Poppins als lokale `.woff2`), Google Fonts wurde entfernt. Strikte CSP: `default-src 'none'; … connect-src 'self' https://<supabase>` plus `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.
  → **Die alte Erklärung behauptet fälschlich, die Website lade Google Fonts. Dieser Satz muss weg.**
- **Keine Zahlungsdaten** — die App ist kostenlos, keine In-App-Käufe im Code.

---

## 4. Betroffenenrechte — wie sie produktseitig umgesetzt sind

| Recht | Umsetzung |
|---|---|
| Auskunft (Art. 15) | Auf Anfrage per E-Mail; alle Inhalte sind zusätzlich in der App einsehbar |
| Berichtigung (Art. 16) | Rezepte, Zutaten, Planung und Passwort in der App änderbar. **Lücke: der Anzeigename/Username ist nach der Registrierung in der App nicht änderbar** — nur per E-Mail-Anfrage |
| Löschung (Art. 17) | **Self-service:** Einstellungen → Konto löschen. Vollständige Löschung inkl. Storage-Objekten und der eigenen Zutatennamen (seit A-6 per Cascade über `ingredients.created_by`). Server-/Auth-Logs bei Supabase und Netlify bleiben gemäß deren Fristen |
| Datenübertragbarkeit (Art. 20) | Kein Export in der App — auf Anfrage per E-Mail |
| Widerspruch (Art. 21) | Betrifft die auf (f) gestützten Verarbeitungen (#17, #18) |
| Beschwerde (Art. 77) | LfDI Baden-Württemberg |

---

## 5. Offene Punkte, die vor Veröffentlichung zu klären sind

1. **Supabase-Region.** Nicht aus dem Repo ermittelbar. Ist das Projekt in `eu-central-1` o. ä., entfällt die Drittlandsproblematik für die Kerndaten; sonst müssen SCCs (Art. 46) konkret benannt werden. **Das ist der wichtigste offene Punkt.**
2. **RLS-Policies sind nicht im Repo.** `supabase/migrations/` enthält nur zwei Dateien (Trigger + `ALTER TABLE`); alle `CREATE TABLE` und **sämtliche RLS-Policies** wurden im Supabase-Dashboard erstellt und sind nicht versioniert. Mehrere Client-Queries laufen ohne User-Filter (u. a. ein `DELETE` auf `recipe_schedule` in `CalendarScreen.js:155`) und verlassen sich vollständig auf RLS. Vor der Aussage „andere Nutzer können Ihre Daten nicht sehen" ist per `pg_policies` bzw. `supabase db dump` zu prüfen: (a) ist RLS auf allen Tabellen aktiv, (b) ist `profiles` für `anon` oder nur für `authenticated` lesbar, (c) exponiert die Public-Read-Policy auf `recipes` die rohe `author`-UUID.
3. **Bucket-Sichtbarkeit.** Alles deutet auf einen privaten Bucket hin (ausschließlich Signed URLs), aber die Bucket-Definition ist nicht im Repo. Wäre er öffentlich, wären alle Fotos unter einem mit der User-UUID beginnenden Pfad erratbar. Im Dashboard verifizieren.
4. **EXIF-Metadaten in Fotos.** Es gibt keine explizite EXIF-Strippung im Code. Faktisch führt `allowsEditing: true` + `aspect` + `quality: 0.8` zu einem Crop mit Neukodierung, wobei EXIF (inkl. GPS) in der Praxis verloren geht; `exif` ist zudem nicht gesetzt (Default `false`). **Empfehlung:** entweder mit einem hochgeladenen Testbild verifizieren und dann positiv formulieren, oder neutral formulieren („Fotos werden vor dem Upload zugeschnitten und neu kodiert") statt „wir erheben keine Standortdaten" absolut zu behaupten.
5. **Android-Berechtigungen.** `expo-image-picker` fügt per Manifest-Merging `CAMERA`, `READ_EXTERNAL_STORAGE` und `WRITE_EXTERNAL_STORAGE` in das Android-Build ein, obwohl kein Kameracode existiert und das Plugin nicht in `app.config.js` eingetragen ist. Die Play-Store-Berechtigungsliste widerspricht sonst der Aussage „kein Kamerazugriff" — ein klarstellender Satz ist sinnvoll.
6. **Veröffentlichungs-Funktion.** Die App setzt `public` hart auf `false`; es gibt keinen Code-Pfad, der ein Rezept veröffentlicht. Die Lesepfade für öffentliche Rezepte existieren aber. Entscheiden: als zukünftige Funktion beschreiben oder vorerst weglassen.
7. **Kein Altersgate.** Weder App noch Website prüfen das Alter (Art. 8 DSGVO / App-Store-Altersfreigabe). Ggf. Mindestalter in den Nutzungsbedingungen festlegen.
8. **Kein Impressum auf der Website.** Das Impressum existiert nur in der App. Für die unter foodytheapp.com betriebene Website ist nach § 5 DDG eine eigene Impressumsseite nötig, verlinkt aus dem Footer (`website/index.html:69`).
9. **Kontakt-E-Mail vereinheitlichen** auf `service@foodytheapp.com`.

---

## 6. Hinweise zu Ton und Aufbau für die schreibende KI

- Sprache der App und der bestehenden Website: **Englisch**. Verantwortlicher sitzt in Deutschland → DSGVO gilt. Zielsprache der neuen Erklärung abstimmen (Empfehlung: Englisch wie bisher, ggf. zweisprachig).
- Pflichtangaben nach Art. 13 DSGVO vollständig abdecken: Identität und Kontakt des Verantwortlichen, Zwecke, Rechtsgrundlagen, berechtigte Interessen bei (f), Empfänger, Drittlandtransfer + Mechanismus, Speicherdauer, Betroffenenrechte, Widerrufsrecht, Beschwerderecht bei der Aufsichtsbehörde, ob die Bereitstellung erforderlich ist und welche Folgen die Nichtbereitstellung hat.
- Ausdrücklich benennen: die lokale unverschlüsselte Session-Speicherung (#6) und die automatische Löschung vergangener Planungseinträge (#13). Das sind die Punkte, die ein Leser nicht erwarten würde. (Die frühere Ableitung des Usernames aus der E-Mail ist mit A-4 entfallen, der globale Zutatenkatalog mit A-6.)
- Positiv herausstellen: keine Analytics/Tracking/Werbung, private Bilder mit 1-Stunden-Signed-URLs, vollständige Self-Service-Kontolöschung inkl. Dateien, cookie- und trackerfreie Website mit strikter CSP.
