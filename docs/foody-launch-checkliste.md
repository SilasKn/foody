# foody — Rechtliche Launch-Checkliste

*Erstellt am 18.08.2026 · Grundlage: Datenverarbeitungs-Übersicht v. 14.08.2026 (Commit `122c9f0`, App-Version 1.0.3) + Interview*

---

## Dein Profil (Ergebnis des Interviews)

| Punkt | Antwort | Rechtliche Folge |
|---|---|---|
| Monetarisierung | keine, dauerhaft kostenlos | kein Gewerbe, keine Umsatzsteuer, kein Widerrufsrecht, kein Apple Paid Apps Agreement |
| Status | Privatperson (angestellt/Student) | Apple Individual Account, bürgerlicher Name als Verkäufer |
| Plattform | nur iOS | Play-Store-Anforderungen entfallen |
| Länder | weltweit | DSGVO + COPPA + DSA-Deklaration relevant |
| Öffentliche Rezepte | deaktiviert | UGC-Pflichten stark reduziert — **aber siehe A-7** |
| Altersfreigabe | 4+ | Konflikt mit Kontopflicht, siehe C-3 |
| Supabase-Region | EU | **kein Drittlandtransfer für Kerndaten** — größter Risikopunkt entschärft |
| Adresse im Store | soll nicht erscheinen | Non-Trader-Deklaration, siehe B-1 |
| Sprache der Dokumente | Englisch | siehe D-4 zum Restrisiko |
| Release | direkt in den Store | kein TestFlight-Puffer, Review-Vorbereitung wichtiger |

**Wichtiger Hinweis:** Ich bin kein Anwalt. Diese Checkliste bildet den Standard-Pfad für eine kostenlose, nicht-kommerzielle App einer Privatperson mit Sitz in Deutschland ab. Die drei Punkte, bei denen eine kurze anwaltliche oder IHK-Rückfrage sinnvoll ist, sind markiert mit **⚖️**.

---

# TEIL A — Code- und Produktänderungen (vor dem Build)

Diese Punkte zuerst, weil sie die Aussagen in den Rechtstexten bestimmen. Wenn du hier etwas änderst, ändert sich der Datenschutztext.

### ☐ A-1 · Supabase-Region schriftlich verifizieren und dokumentieren

**Was zu tun ist:** Supabase Dashboard → Project Settings → General → „Region". Screenshot machen, mit Datum in einem Ordner `legal/evidence/` ablegen.

**Warum:** Du behauptest in der Datenschutzerklärung „alle Daten werden auf Servern in der EU verarbeitet". Diese Aussage muss belegbar sein. Liegt das Projekt doch außerhalb der EU, brauchst du Standardvertragsklauseln nach Art. 46 DSGVO und einen zusätzlichen Absatz im Text — das ist der teuerste Fehler, den du hier machen kannst.

**Fertig, wenn:** Screenshot zeigt eine EU-Region (z. B. `eu-central-1`, Frankfurt).

---

### ☐ A-2 · RLS-Policies prüfen und ins Repo versionieren

**Was zu tun ist:** Im Supabase SQL Editor ausführen:

```sql
-- Ist RLS überall aktiv?
select c.relname as tabelle, c.relrowsecurity as rls_aktiv
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by 1;

-- Welche Policies existieren, und für welche Rolle?
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

Prüfe drei Dinge konkret:
1. `rls_aktiv = true` bei **allen** Tabellen in `public`
2. `profiles` — ist die SELECT-Policy auf `authenticated` beschränkt oder auch für `anon` offen? Bei `anon` kann jeder mit dem Anon-Key alle Usernamen abziehen.
3. `recipes` — exponiert eine Public-Read-Policy die rohe `author`-UUID?

Anschließend `supabase db dump --schema public > supabase/migrations/schema.sql` und committen.

**Warum:** Die Analyse zeigt, dass mehrere Client-Queries ohne User-Filter laufen (u. a. ein `DELETE` auf `recipe_schedule` in `CalendarScreen.js:155`) und sich vollständig auf RLS verlassen. Wäre RLS auf einer Tabelle aus, könnte ein Nutzer die Daten aller anderen lesen oder löschen. Das wäre eine meldepflichtige Datenpanne nach Art. 33 DSGVO — und du dürftest den Satz „andere Nutzer haben keinen Zugriff auf Ihre Daten" nicht schreiben. Art. 32 DSGVO verlangt zusätzlich, dass du die Wirksamkeit deiner Schutzmaßnahmen regelmäßig überprüfst; diese Abfrage ist genau diese Überprüfung.

**Fertig, wenn:** Alle Tabellen haben RLS aktiv, alle Policies filtern auf `auth.uid()`, Schema ist versioniert.

---

### ☐ A-3 · Storage-Bucket-Sichtbarkeit verifizieren

**Was zu tun ist:** Dashboard → Storage → Bucket `recipe_images` → prüfen, dass „Public bucket" **aus** ist.

**Warum:** Die Dateipfade folgen dem Muster `<user_id>/<recipe_id>/<timestamp>.<ext>`. Bei einem öffentlichen Bucket wären alle Fotos ohne Login abrufbar, sobald jemand eine User-UUID kennt — und die UUID steckt bereits im JWT jedes Nutzers. Der Code verwendet ausschließlich Signed URLs mit 1 Stunde Gültigkeit, was auf einen privaten Bucket hindeutet, aber die Bucket-Definition ist nicht im Repo.

**Fertig, wenn:** Bucket ist privat, `getPublicUrl` kommt nirgends im Code vor (ist laut Analyse bereits so).

---

### ☑ A-4 · Username-Ableitung aus der E-Mail beseitigen — **erledigt**

**Was zu tun ist:** Den Trigger `handle_new_user` ändern. Statt `split_part(email,'@',1)` entweder einen zufälligen Namen (`'user_' || substr(md5(random()::text),1,8)`) setzen oder den Anzeigenamen bei der Registrierung zum Pflichtfeld machen.

**Umgesetzt als Pflichtfeld:** `supabase/migrations/20260818120000_require_username_on_signup.sql` entfernt den E-Mail-Fallback aus dem Trigger und setzt `profiles.username` auf `NOT NULL` samt Leer-Check. `supabase/migrations/20260819120000_unique_username.sql` macht den Namen zusätzlich eindeutig (Unique-Index auf `lower(trim(username))`, Groß-/Kleinschreibung wird also ignoriert) und stellt die RPC `is_username_available` bereit, mit der das Registrierungsformular schon während der Eingabe meldet, ob ein Name frei ist. Bestandsnutzer mit kollidierenden Namen haben in der zweiten Migration ein kurzes Suffix bekommen.

**Warum:** Bis dahin wurde bei fehlendem Anzeigenamen der lokale Teil der E-Mail-Adresse zum Username. Bei `vorname.nachname@…` steht damit der Klarname in einer Tabelle, die potenziell für andere Nutzer lesbar ist. Das ist eine Datenverarbeitung, die kein Nutzer erwartet, und sie widerspricht dem Grundsatz der Datenminimierung (Art. 5 Abs. 1 lit. c DSGVO) sowie Privacy by Default (Art. 25 Abs. 2). Du *kannst* das stattdessen nur offenlegen — aber Beseitigen ist billiger als Erklären, und der Datenschutztext wird dadurch deutlich einfacher.

**Fertig, wenn:** Neue Registrierungen erzeugen keinen aus der E-Mail abgeleiteten Username mehr. Bestandsnutzer aus der TestFlight-Phase ggf. migrieren.

---

### ☐ A-5 · Anzeigename in der App änderbar machen

**Was zu tun ist:** Ein Eingabefeld in den Einstellungen, das `profiles.username` aktualisiert.

**Warum:** Art. 16 DSGVO gibt jedem das Recht auf Berichtigung unrichtiger personenbezogener Daten. Aktuell ist der Username nach der Registrierung nur per E-Mail-Anfrage an dich änderbar. Das ist rechtlich zulässig, aber es bedeutet, dass du diese Anfragen innerhalb eines Monats manuell bearbeiten musst (Art. 12 Abs. 3). Ein Textfeld ist weniger Aufwand als ein Support-Prozess.

**Fertig, wenn:** Username in der App änderbar oder ein dokumentierter Mail-Prozess existiert.

---

### ☑ A-6 · Zutaten-Tabelle: Löschlücke und Sichtbarkeit schließen — **erledigt**

**Was zu tun ist:** Eine Owner-Spalte (`created_by uuid references auth.users on delete cascade`) zu `public.ingredients` hinzufügen, oder — besser — die Tabelle auf einen kuratierten, von dir gepflegten Katalog umstellen, in den Nutzer nichts schreiben.

**Umgesetzt als Owner-Spalte mit Isolierung:** `supabase/migrations/20260819130000_ingredients_owner.sql` macht `created_by` zur Pflichtspalte mit Cascade auf `auth.users`, teilt die bisher geteilten Zeilen pro Nutzer auf, hängt die vorhandenen `recipe_ingredients` auf die jeweils eigene Kopie um und schaltet RLS scharf: gelesen und geschrieben wird nur, wo `auth.uid() = created_by`. Ein Unique-Index auf `(created_by, lower(trim(name)))` hält die Kopien pro Nutzer eindeutig. Die App liest die Tabelle entsprechend nicht mehr global, sondern gefiltert (`AddRecipeScreen.js`, `getIngredientIdsByName`), und schreibt `created_by` beim Anlegen mit.

**Wichtig für die Reihenfolge:** Die Isolierung ist nicht optional, wenn das Cascade richtig sein soll. Bliebe der Katalog geteilt, würde `created_by` nur den *ersten* Nutzer festhalten, der einen Namen getippt hat — und dessen Kontolöschung würde Zeilen entfernen, auf die die Rezepte anderer Nutzer noch zeigen. Erst durch die Aufteilung pro Nutzer ist `on delete cascade` gefahrlos.

**Warum, gleich doppelt:**
1. **DSGVO:** Bei Kontolöschung bleiben die eingetragenen Zutatennamen bestehen, weil es keine Owner-Spalte und kein Cascade gibt. Freitext-Eingaben können personenbezogen sein („Omas Rezept", „Für Lisas Geburtstag"). Art. 17 verlangt vollständige Löschung.
2. **Apple:** Jeder eingetippte Zutatenname landet in einer globalen Tabelle, die alle Nutzer ungefiltert lesen. Das ist technisch nutzergenerierter Inhalt, der anderen Nutzern angezeigt wird — und damit Guideline 1.2 (User-Generated Content). Apple verlangt dort ein Filtersystem, eine Meldefunktion, eine Blockiermöglichkeit und veröffentlichte Kontaktdaten. Wenn du die Zutaten pro Nutzer isolierst oder kuratierst, entfällt dieser gesamte Pflichtenblock, und du kannst die UGC-Frage im Age-Rating-Fragebogen ehrlich mit „nein" beantworten.

**Fertig, wenn:** Kein Nutzer sieht Freitext, den ein anderer Nutzer eingegeben hat.

---

### ☐ A-7 · Veröffentlichungs-Funktion sauber deaktivieren

**Was zu tun ist:** Da du das Teilen vorerst nicht aktivierst — die Lesepfade für öffentliche Rezepte (`public = true`) entweder entfernen oder die RLS-Policy so setzen, dass sie ins Leere läuft.

**Warum:** Die Analyse stellt fest, dass die App `public` hart auf `false` setzt, die Lesepfade für öffentliche Rezepte aber existieren. Toter Code mit aktiver Policy ist ein Risiko: Wenn jemand über die API direkt `public = true` setzt (die Policy könnte das erlauben), werden Rezepte sichtbar, obwohl deine Datenschutzerklärung das Gegenteil sagt. Lass die Erklärung schweigen über ein Feature, das es nicht gibt — sonst musst du sie beim Aktivieren ohnehin neu schreiben.

**Fertig, wenn:** Kein Pfad kann ein Rezept sichtbar machen; die Datenschutzerklärung erwähnt kein Teilen.

---

### ☐ A-8 · EXIF-Verhalten empirisch prüfen

**Was zu tun ist:** Ein Foto mit aktiviertem GPS-Tag aufnehmen, in der App als Rezeptbild hochladen, über die Signed URL wieder herunterladen und prüfen:

```bash
exiftool -G -a heruntergeladenes_bild.jpg | grep -i -E "gps|location|serial|model"
```

**Warum:** Es gibt keine explizite EXIF-Strippung im Code. Faktisch führt `allowsEditing: true` mit `aspect` und `quality: 0.8` zu einem Zuschnitt mit Neukodierung, wobei EXIF in der Praxis verloren geht. „In der Praxis" reicht aber nicht für einen absoluten Satz wie „wir erheben keine Standortdaten". Sind GPS-Daten enthalten, verarbeitest du Standortdaten, ohne es zu wissen — und deine App-Store-Privacy-Labels wären falsch.

**Fertig, wenn:** Entweder Test bestanden (dann darfst du positiv formulieren) oder du formulierst neutral: „Fotos werden vor dem Upload zugeschnitten und neu kodiert." Der beigefügte Entwurf nutzt die neutrale Formulierung — passe ihn nach dem Test an.

---

### ☐ A-9 · Privacy Manifest ergänzen — **Code eingebaut, Nachweis offen**

**Was zu tun ist:** In `app.config.js` unter `ios`:

```js
privacyManifests: {
  NSPrivacyAccessedAPITypes: [
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
      NSPrivacyAccessedAPITypeReasons: ["CA92.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
      NSPrivacyAccessedAPITypeReasons: ["C617.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
      NSPrivacyAccessedAPITypeReasons: ["E174.1"] },
    { NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
      NSPrivacyAccessedAPITypeReasons: ["35F9.1"] }
  ]
}
```

**Warum:** Apple verlangt für sogenannte „Required Reason APIs" eine Begründung im Privacy Manifest. <cite index="14-1">Die React-Native-Runtime greift allein über AsyncStorage auf UserDefaults zu, über das Image-Caching auf FileTimestamp und über bestimmte Netzwerkbibliotheken auf SystemBootTime.</cite> <cite index="14-1">Apple wertet das Manifest des App-Targets zuerst aus, und eine fehlende Kategorie dort genügt, um beim Upload die Warnung ITMS-91056 auszulösen.</cite> Du nutzt AsyncStorage für die Session — UserDefaults ist also definitiv betroffen.

**Fertig, wenn:** Upload nach App Store Connect ohne ITMS-91056-Mail durchläuft.

**Stand:** `privacyManifests` steht in `app.config.js` unter `ios`, zusätzlich mit `NSPrivacyTracking: false` und leeren `NSPrivacyTrackingDomains`/`NSPrivacyCollectedDataTypes`. Ein Prebuild erzeugt daraus `ios/foody/PrivacyInfo.xcprivacy` mit allen vier Kategorien, und die Datei ist im Xcode-Target referenziert. Offen bleibt nur der Nachweis über einen echten Upload — Haken erst danach setzen.

---

### ☑ A-10 · Export-Compliance deklarieren — **erledigt**

**Was zu tun ist:** In `app.config.js` unter `ios.config`: `usesNonExemptEncryption: false`.

**Warum:** Apple fragt bei jedem Upload nach US-Exportbestimmungen für Verschlüsselung. Deine App nutzt ausschließlich HTTPS/TLS und Standard-Betriebssystemkrypto — das fällt unter die Ausnahme. Ohne die Deklaration im Config-File musst du die Frage bei jedem einzelnen Build manuell beantworten, und eine falsche Antwort blockiert die Freigabe.

**Fertig, wenn:** Der Build fragt nicht mehr nach.

**Stand:** Bereits erfüllt über `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` in `app.config.js` — äquivalent zu `ios.config.usesNonExemptEncryption`. Nicht zusätzlich eintragen, sonst gibt es zwei Quellen für dieselbe Aussage.

---

### ☐ A-11 · Kontakt-E-Mail vereinheitlichen

**Was zu tun ist:** Alle fünf Vorkommen von `siknago@gmail.com` durch `service@foodytheapp.com` ersetzen. Sicherstellen, dass das Postfach existiert, funktioniert und regelmäßig gelesen wird.

**Warum:** Art. 13 Abs. 1 lit. a DSGVO und § 5 DDG verlangen eine funktionierende Kontaktmöglichkeit. Eine private Gmail-Adresse in der Datenschutzerklärung, die vom Impressum abweicht, ist widersprüchlich und wirkt unseriös. Betroffenenanfragen und Behördenpost laufen hierüber — ein ungelesenes Postfach führt zu Fristversäumnissen (ein Monat nach Art. 12 Abs. 3).

**Fertig, wenn:** Grep über das Repo findet keine Gmail-Adresse mehr.

---

# TEIL B — Apple Developer & App Store Connect

### ☐ B-1 · Trader Status als **Non-Trader** deklarieren

**Was zu tun ist:** App Store Connect → Business → Trader Status. Nur als Account Holder oder Admin möglich. „Non-Trader" wählen.

**Warum:** <cite index="4-1">Die Artikel 30 und 31 des Digital Services Act verpflichten Apple, Kontaktdaten von Händlern zu prüfen und auf der Produktseite anzuzeigen — Anschrift, Telefonnummer und E-Mail-Adresse.</cite> Als Non-Trader entfällt genau das: keine Adressanzeige im Store, was deinem Wunsch entspricht. <cite index="8-1">Non-Trader ist die enge Kategorie für Einzelpersonen, die kostenlose Apps ohne kommerzielle Aktivität verbreiten</cite> — das trifft auf dich exakt zu.

**Zwei Dinge, die du wissen musst:**
- <cite index="4-1">Auch wenn du keine Apps in der EU verbreitest, musst du eine Trader-Status-Erklärung abgeben.</cite> Die Deklaration ist also nicht optional, nur ihr Inhalt.
- <cite index="4-1">Bist du kein Händler, werden Verbraucher in der EU darüber informiert, dass Verbraucherschutzrechte aus geltenden Gesetzen nicht auf Verträge zwischen dir und ihnen anwendbar sind.</cite> Das ist bei einer kostenlosen App unproblematisch.

**Achtung — kein Wackeln:** <cite index="8-1">Die Entfernung erfolgt automatisch, betrifft auch bereits genehmigte und live geschaltete Apps und hat nichts damit zu tun, ob sich deine App geändert hat.</cite> Wenn du später monetarisierst, musst du sofort auf Trader umstellen — und dann wird deine Anschrift öffentlich (siehe H-1).

**Fertig, wenn:** Status ist gesetzt und in App Store Connect bestätigt.

---

### ☐ B-2 · Verkäufername akzeptieren oder Alternative wählen

**Was zu tun ist:** Zur Kenntnis nehmen, dass unter deinem Individual-Account „Silas Knapp" als Verkäufername auf der Produktseite steht.

**Warum:** Bei einem Individual-Account ist der Verkäufername an deine verifizierte Identität gebunden. Ein abweichender Anzeigename („foody") setzt regulär einen Organization-Account voraus, und der verlangt eine D-U-N-S-Nummer sowie eine eingetragene Rechtsform — also mindestens eine UG. Für eine kostenlose App ist das unverhältnismäßig (UG-Gründung, Notar, Handelsregister, Buchführungspflicht, Jahresabschluss).

**Praktische Konsequenz:** Dein Name ist im Store sichtbar, deine Anschrift nicht (dank B-1). Deine Anschrift steht dagegen zwingend im Impressum in der App und auf der Website — das ist die Trennung, die du im Interview wolltest.

**Fertig, wenn:** Entscheidung bewusst getroffen.

---

### ☐ B-3 · App Privacy Labels ausfüllen

**Was zu tun ist:** App Store Connect → App Privacy. Vorschlag auf Basis der Code-Analyse:

| Kategorie | Erhoben? | Verknüpft mit Nutzer? | Zweck | Tracking? |
|---|---|---|---|---|
| Contact Info → Email Address | Ja | Ja | App Functionality | Nein |
| Identifiers → User ID | Ja | Ja | App Functionality | Nein |
| User Content → Photos or Videos | Ja | Ja | App Functionality | Nein |
| User Content → Other User Content (Rezepte, Zutaten, Planung) | Ja | Ja | App Functionality | Nein |
| Usage Data | Nein | — | — | — |
| Diagnostics | Nein | — | — | — |
| Location | Nein | — | — | — |
| Alle übrigen Kategorien | Nein | — | — | — |

Bei „Does your app use data for tracking?" → **Nein**. Kein IDFA, kein `expo-tracking-transparency`, keine Werbe-SDKs.

**Warum:** Die Labels sind eine verbindliche Zusicherung gegenüber Apple. Abweichungen zwischen Labels, Datenschutzerklärung und tatsächlichem Verhalten sind einer der häufigsten Ablehnungsgründe und können nach dem Launch zur Entfernung führen. Deine Position ist hier ungewöhnlich stark: <cite index="0-1">kein Sentry, Firebase, Amplitude, PostHog, Mixpanel, Segment, AdMob, RevenueCat oder Bugsnag</cite> — nutze das, statt vorsichtshalber zu viel anzukreuzen.

**Zu den Server-Logs:** IP-Adressen in den Auth-Logs von Supabase musst du hier nicht deklarieren. Apples Definition von „collect" zielt auf Daten, die die App vom Gerät überträgt und über die Bearbeitung der Anfrage hinaus speichert; reine Sicherheits- und Betriebsprotokolle des Auftragsverarbeiters fallen unter die Ausnahme. In der DSGVO-Erklärung gehören sie trotzdem hinein — die beiden Regelwerke haben unterschiedliche Schwellen.

**Fertig, wenn:** Labels gesetzt und mit dem finalen Datenschutztext abgeglichen.

---

### ☐ B-4 · Privacy Policy URL und Support URL hinterlegen

**Was zu tun ist:** In App Store Connect die URL `https://foodytheapp.com/privacy-policy` als Privacy Policy URL eintragen, plus eine Support-URL (kann eine schlichte Kontaktseite sein).

**Warum:** Beides sind Pflichtfelder. Die Datenschutz-URL muss ohne Login öffentlich erreichbar sein und darf nicht ins Leere laufen — Apple prüft das automatisiert. Guideline 5.1.1 verlangt zusätzlich, dass die Datenschutzerklärung **auch in der App** verlinkt ist. Prüfe, dass beide Verlinkungen existieren.

**Fertig, wenn:** Beide URLs liefern HTTP 200 und zeigen den neuen Text.

---

### ☐ B-5 · Age Rating ausfüllen — mit Bedacht

**Was zu tun ist:** Den Fragebogen ehrlich beantworten. Nach Umsetzung von A-6 kannst du „user-generated content" mit Nein beantworten. Ergebnis: 4+.

**Was du nicht tun darfst:** Die Kategorie „Kids" wählen. Dann greift Apples Kids-Category-Regime: kein Zugriff auf externe Links ohne Elterngate, strengste Datenschutzregeln, und du müsstest COPPA vollständig umsetzen.

**Warum der Konflikt entsteht:** Die App ist ohne Konto nicht nutzbar. Bei einer Freigabe ab 4+ und weltweiter Verfügbarkeit könnten formal Achtjährige ein Konto anlegen. Dann greifen COPPA (USA, unter 13 Jahren: nachweisbare Elterneinwilligung) und Art. 8 DSGVO (in Deutschland: unter 16 Jahren Einwilligung der Sorgeberechtigten).

**Die saubere Lösung** ist nicht, die Freigabe hochzusetzen — die beschreibt nur die Inhalte, und deine Inhalte sind harmlos. Sie besteht darin, in den Nutzungsbedingungen ein **Mindestalter von 16 Jahren** festzulegen und die App nicht an Kinder zu richten. Das ist gängige und akzeptierte Praxis; der beigefügte Terms-Entwurf enthält die entsprechende Klausel.

**Fertig, wenn:** Rating gesetzt, Mindestalter in den Terms, keine kindgerichtete Vermarktung im Store-Text.

---

### ☐ B-6 · Reviewer-Zugang vorbereiten

**Was zu tun ist:** In den App Review Information einen funktionierenden Demo-Account (E-Mail + Passwort) hinterlegen und in den Notes ergänzen:

> The app requires an account. Demo credentials are provided above.
> Account deletion: Settings → Delete Account (permanent, includes all stored images).
> The app collects no analytics and contains no advertising.

**Warum:** Guideline 2.1 führt zu sofortiger Ablehnung, wenn der Reviewer die App nicht nutzen kann. Und Guideline 5.1.1(v) verlangt bei Apps mit Kontoerstellung eine **in der App auffindbare** Löschfunktion — Apple prüft das aktiv und lehnt ab, wenn der Reviewer sie nicht findet. Deine Edge Function `delete-account` erfüllt die Anforderung technisch vorbildlich (rekursive Storage-Löschung mit Verifikation), aber der Reviewer muss den Weg dorthin finden.

**Fertig, wenn:** Demo-Account getestet, Notes hinterlegt.

---

### ☐ B-7 · Sign in with Apple — nicht erforderlich

**Was zu tun ist:** Nichts. Nur zur Kenntnis.

**Warum:** Guideline 4.8 verlangt Sign in with Apple (oder eine gleichwertige Alternative) nur, wenn du Login über Drittanbieter wie Google oder Facebook anbietest. Du nutzt ausschließlich E-Mail und Passwort über Supabase Auth — damit greift die Pflicht nicht.

---

# TEIL C — Gewerbe, Steuern, Versicherung

### ☐ C-1 · Keine Gewerbeanmeldung — aber Trigger kennen **⚖️**

**Was zu tun ist:** Nichts anmelden. Diese Entscheidung aber kurz dokumentieren (Datum, Begründung), falls später jemand fragt.

**Warum:** § 14 GewO verlangt eine Anmeldung für den Betrieb eines stehenden Gewerbes. Ein Gewerbe setzt eine selbständige, planmäßige, nach außen gerichtete Tätigkeit **mit Gewinnerzielungsabsicht** voraus. Eine dauerhaft kostenlose App ohne Einnahmen, ohne Werbung und ohne Spendenfunktion erfüllt dieses Merkmal nicht. Damit entfallen zugleich: Umsatzsteuer, Kleinunternehmerregelung nach § 19 UStG, Gewerbesteuer, IHK-Beitrag, EÜR und Anlage G.

**Ab wann es kippt — jeder einzelne Punkt löst die Anmeldepflicht aus:**
- ein Kaufpreis für die App oder eine Pro-Version
- In-App-Käufe oder Abonnements jeder Art
- Werbung, auch nur ein Banner
- Sponsoring oder bezahlte Kooperationen
- Affiliate-Links (z. B. zu Küchengeräten)
- Verkauf der App oder des Nutzerstamms

Freiwillige Spenden ohne Gegenleistung sind ein Graubereich. Sobald sie regelmäßig und in nennenswerter Höhe fließen, nehmen Finanzämter Gewinnerzielungsabsicht an. Wenn du das planst, kläre es vorher — nicht nachher.

**Anmeldefrist, falls es soweit kommt:** unverzüglich, praktisch mit Aufnahme der Tätigkeit, beim Gewerbeamt Dettingen an der Erms. Kosten üblicherweise 20–60 €. Danach kommt automatisch der Fragebogen zur steuerlichen Erfassung vom Finanzamt.

**Fertig, wenn:** Entscheidung dokumentiert, Trigger-Liste an einem Ort abgelegt, den du wiederfindest.

---

### ☐ C-2 · Arbeitsvertrag oder Studienordnung prüfen **⚖️**

**Was zu tun ist:** Falls du angestellt bist: Arbeitsvertrag auf zwei Klauseltypen durchsehen.

**Warum:**
1. **Nebentätigkeitsklauseln** verlangen häufig eine Anzeige oder Genehmigung — teils auch bei unentgeltlichen Tätigkeiten, wenn sie öffentlich sichtbar sind. Deine App erscheint unter deinem Klarnamen im App Store.
2. **Rechte-an-Arbeitsergebnissen-Klauseln** sind der wichtigere Punkt. Manche Arbeitsverträge weisen dem Arbeitgeber Rechte an Software zu, die im selben Tätigkeitsfeld entsteht — auch in der Freizeit. Wenn du hauptberuflich Software entwickelst und foody in dieselbe Richtung geht, sieh genau hin. Bei Studium ohne Anstellung ist dieser Punkt gegenstandslos.

**Fertig, wenn:** Vertrag geprüft, ggf. formlose Anzeige beim Arbeitgeber erfolgt.

---

### ☐ C-3 · Versicherung — bewusste Entscheidung

**Was zu tun ist:** Prüfen, ob deine private Haftpflichtversicherung Schäden aus einer veröffentlichten Software abdeckt. In der Regel tut sie das nicht.

**Warum:** Ohne Einnahmen ist eine Betriebshaftpflicht oder Cyber-Versicherung unverhältnismäßig. Das Restrisiko besteht vor allem in einer Datenpanne mit Schadensersatzansprüchen nach Art. 82 DSGVO. Bei einer kostenlosen App mit den Daten aus deiner Analyse (E-Mail, Rezepte, Essensplanung) ist das Schadenspotenzial überschaubar, aber nicht null. Die wirksamste Maßnahme ist hier nicht eine Police, sondern A-2: korrekte RLS-Policies.

**Fertig, wenn:** Entscheidung bewusst getroffen.

---

# TEIL D — Impressum

### ☐ D-1 · Impressum auf der Website ergänzen

**Was zu tun ist:** Eine Seite `foodytheapp.com/legal-notice` anlegen, aus dem Footer verlinken (`website/index.html:69`), Linktext eindeutig („Legal Notice" oder „Imprint").

**Warum:** § 5 DDG verpflichtet Diensteanbieter zur Anbieterkennzeichnung. Die Vorschrift gilt für „geschäftsmäßige, in der Regel gegen Entgelt angebotene" Telemedien. Deine App ist kostenlos — aber „geschäftsmäßig" wird weit ausgelegt und meint nachhaltiges, planmäßiges Anbieten, nicht Gewinnerzielung. Eine öffentlich im App Store vertriebene App mit eigener Domain fällt nach überwiegender Auffassung darunter; die Ausnahme greift nur für rein private oder familiäre Angebote.

Wirtschaftlich betrachtet ist die Sache eindeutig: Ein Impressum kostet dich zwanzig Minuten. Ein fehlendes Impressum ist ein klassischer Abmahngrund mit Anwaltskosten im dreistelligen Bereich. Laut deiner Analyse existiert das Impressum bisher nur in der App — die Website hat keines.

**Formanforderungen** — die Rechtsprechung ist hier streng:
- **leicht erkennbar:** eindeutige Bezeichnung, nicht in AGB versteckt
- **unmittelbar erreichbar:** höchstens zwei Klicks von jeder Seite
- **ständig verfügbar:** auch bei JS-Fehlern erreichbar

**Pflichtangaben in deinem Fall:**
- Vor- und Nachname (nicht nur „foody" — die alte Fassung nennt nur den Produktnamen)
- ladungsfähige Anschrift — Straße, Hausnummer, PLZ, Ort. **Kein Postfach, keine c/o-Adresse.**
- E-Mail-Adresse
- ein zweiter Weg für schnelle Kontaktaufnahme

Nicht erforderlich: Umsatzsteuer-Identifikationsnummer (hast du nicht), Handelsregister, Aufsichtsbehörde, Berufsbezeichnung.

**Zur Telefonnummer:** § 5 Abs. 1 Nr. 2 DDG verlangt Angaben, die eine schnelle elektronische Kontaktaufnahme und unmittelbare Kommunikation ermöglichen. Nach der Rechtsprechung des EuGH ist eine Telefonnummer nicht zwingend, wenn ein anderer Kanal mit vergleichbar schneller Reaktion existiert — ein Kontaktformular mit zugesagter Antwortzeit genügt. Da du deine Privatnummer vermutlich nicht veröffentlichen willst: E-Mail plus Kontaktformular. Der Entwurf ist so gebaut.

**Fertig, wenn:** Seite live, aus dem Footer verlinkt, in maximal zwei Klicks erreichbar.

---

### ☐ D-2 · Impressum in der App korrigieren

**Was zu tun ist:** `ImprintScreen.js` gegen den Entwurf abgleichen, E-Mail-Adresse vereinheitlichen (siehe A-11).

**Warum:** Auch die App selbst ist ein Telemedium. Die Angaben in App und Website müssen identisch sein — Abweichungen bei Anschrift oder Kontaktadresse sind ein eigener Angriffspunkt.

---

### ☐ D-3 · Verlinkung aus dem App Store

**Was zu tun ist:** Nichts Zusätzliches. Die Privacy Policy URL (B-4) plus Impressum in App und Website reicht.

**Warum:** Da du Non-Trader bist, verlangt Apple keine Händlerkontaktdaten auf der Produktseite. Die Impressumspflicht erfüllst du auf deinen eigenen Kanälen.

---

### ☐ D-4 · Sprachentscheidung dokumentieren **⚖️**

**Was zu tun ist:** Zur Kenntnis nehmen und bewusst entscheiden.

**Warum:** Du hast Englisch gewählt, und das ist gut begründbar: App und Website sind vollständig englischsprachig, das Angebot richtet sich weltweit an ein englischsprachiges Publikum. Die Rechtsprechung stellt darauf ab, an welchen Adressatenkreis sich das Angebot richtet — ein rein englisches Angebot darf ein englisches Impressum haben.

**Das Restrisiko:** Ein deutscher Nutzer oder Mitbewerber könnte argumentieren, dass ein Anbieter mit Sitz in Deutschland deutschen Nutzern die Pflichtangaben auf Deutsch schuldet. Eine zusätzliche deutsche Fassung unter `/impressum` kostet dich nichts und nimmt diesen Angriffspunkt vollständig weg. Sag Bescheid, wenn du sie willst — ich übersetze die Entwürfe.

---

# TEIL E — Datenschutz

### ☐ E-1 · Neue Datenschutzerklärung veröffentlichen

**Was zu tun ist:** `website/privacy-policy/index.html` durch den beigefügten Entwurf ersetzen, in der App verlinken.

**Was der Text zwingend enthalten muss (Art. 13 DSGVO):** Identität und Kontaktdaten des Verantwortlichen · Zwecke jeder Verarbeitung · Rechtsgrundlage für jede Verarbeitung · bei berechtigtem Interesse: welches konkret · Empfänger und Kategorien von Empfängern · Drittlandtransfers und der Garantiemechanismus · Speicherdauer oder Kriterien dafür · sämtliche Betroffenenrechte · Widerrufsrecht bei Einwilligungen · Beschwerderecht bei der Aufsichtsbehörde · ob die Bereitstellung erforderlich ist und was passiert, wenn man sie verweigert · ob automatisierte Entscheidungsfindung stattfindet.

Der Entwurf deckt alle diese Punkte ab.

**Drei Fehler der alten Fassung, die du beheben musst:**
1. Der Verantwortliche wird nur als „foody" bezeichnet — ein Produktname ist keine Rechtsperson. Art. 13 Abs. 1 lit. a verlangt Identität **und** Anschrift.
2. An fünf Stellen steht `siknago@gmail.com` statt der Impressumsadresse.
3. Der Text behauptet, die Website lade Google Fonts. Das ist seit der Umstellung auf selbst gehostete `.woff2`-Dateien falsch. Eine unzutreffende Angabe in der Datenschutzerklärung ist ein eigenständiger Verstoß gegen den Transparenzgrundsatz — und ausgerechnet Google Fonts ist ein bekanntes Abmahnthema.

**Drei Dinge, die ein Leser nicht erwartet und die deshalb ausdrücklich im Text stehen:** die lokale unverschlüsselte Sitzungsspeicherung, die automatische Löschung vergangener Planungseinträge, der Verbleib von Zutatennamen nach der Kontolöschung (entfällt bei Umsetzung von A-6). Die Ableitung des Usernames aus der E-Mail ist mit A-4 entfallen.

---

### ☐ E-2 · Auftragsverarbeitungsverträge abschließen

**Was zu tun ist:**
- **Supabase:** DPA im Dashboard akzeptieren beziehungsweise abrufen (Organization Settings → Legal Documents). PDF speichern.
- **Netlify:** DPA über die Legal-Seiten abrufen und speichern.

**Warum:** Art. 28 Abs. 3 DSGVO verlangt einen Vertrag mit jedem Auftragsverarbeiter — schriftlich oder elektronisch, mit festgelegtem Inhalt. Kein Vertrag bedeutet einen Verstoß, unabhängig davon, wie sicher der Dienst technisch ist. Beide Anbieter stellen Standard-DPAs bereit; du musst sie nur aktiv annehmen und aufbewahren. Bei einer Prüfung durch den LfDI ist das die erste Frage.

**Expo/EAS** braucht keinen DPA: Der Dienst verarbeitet nur zur Build-Zeit und sieht keine Endnutzerdaten. Da kein `expo-updates` installiert ist, gibt es weder einen OTA-Kanal noch Laufzeit-Telemetrie.

**Fertig, wenn:** Beide DPAs als PDF in `legal/dpa/` liegen.

---

### ☐ E-3 · Netlify-Drittlandtransfer absichern

**Was zu tun ist:** Prüfen, ob Netlify unter dem EU-US Data Privacy Framework zertifiziert ist (Suche auf `dataprivacyframework.gov`). Ergebnis im Datenschutztext benennen.

**Warum:** Nach Klärung der Supabase-Region ist Netlify dein einziger verbleibender Drittlandbezug — konkret die Server-Logs der Website mit IP-Adresse, Zeitstempel, User-Agent und angeforderter Ressource. Für die Übermittlung brauchst du eine Rechtsgrundlage nach Kapitel V DSGVO: entweder den Angemessenheitsbeschluss über das DPF (Art. 45) oder Standardvertragsklauseln (Art. 46). Der Entwurf nennt beide Möglichkeiten — streiche nach der Prüfung die nicht zutreffende.

**Alternative, falls du es ganz vermeiden willst:** Die Website ist statisch und winzig. Ein EU-Hoster würde den gesamten Absatz überflüssig machen.

---

### ☐ E-4 · Verzeichnis von Verarbeitungstätigkeiten erstellen

**Was zu tun ist:** Deine vorhandene Analyse als Grundlage nehmen und um ein Deckblatt ergänzen: Verantwortlicher mit Anschrift, Stand und Version, Kategorien betroffener Personen, technische und organisatorische Maßnahmen, Löschfristen. Nicht veröffentlichen — nur intern aufbewahren.

**Warum:** Art. 30 Abs. 5 befreit Verantwortliche mit weniger als 250 Beschäftigten — aber nur, wenn die Verarbeitung „nur gelegentlich" erfolgt. Deine Verarbeitung ist dauerhaft und systematisch, also greift die Ausnahme nicht. Das Verzeichnis ist der Aufsichtsbehörde auf Verlangen vorzulegen. Der gute Teil: Dein Dokument enthält bereits geschätzt achtzig Prozent des Erforderlichen in genau der richtigen Struktur.

---

### ☐ E-5 · Technische und organisatorische Maßnahmen dokumentieren

**Was zu tun ist:** Eine Seite in `legal/`, die auflistet, was du zum Schutz der Daten tust:

- Transportverschlüsselung durchgehend über TLS
- Passwörter serverseitig mit bcrypt gehasht (Supabase Auth)
- Zugriffskontrolle über Row Level Security auf Datenbankebene
- Bilder in einem privaten Bucket, Zugriff nur über zeitlich begrenzte Signed URLs (1 Stunde)
- Zwei-Faktor-Authentifizierung auf Supabase-, Apple- und GitHub-Konto
- strikte Content Security Policy auf der Website, plus `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
- Backups über Supabase, Wiederherstellung getestet am [Datum]

**Warum:** Art. 32 verlangt geeignete Schutzmaßnahmen **und** ein Verfahren zu deren regelmäßiger Überprüfung. Undokumentierte Maßnahmen zählen im Streitfall nicht. Und: Aktiviere die Zwei-Faktor-Authentifizierung wirklich — dein Supabase-Konto ist der Generalschlüssel zu allen Nutzerdaten.

---

### ☐ E-6 · Prozess für Betroffenenanfragen festlegen

**Was zu tun ist:** Für jedes Recht einen Weg festlegen und aufschreiben:

| Recht | Weg | Frist |
|---|---|---|
| Auskunft (Art. 15) | manueller Export per SQL, Versand an die verifizierte E-Mail | 1 Monat |
| Berichtigung (Art. 16) | in der App, sonst per Mail | 1 Monat |
| Löschung (Art. 17) | Self-Service in den Einstellungen | sofort |
| Einschränkung (Art. 18) | manuell, Flag setzen | 1 Monat |
| Datenübertragbarkeit (Art. 20) | JSON-Export, Skript vorbereiten | 1 Monat |
| Widerspruch (Art. 21) | betrifft die auf berechtigtem Interesse gestützten Server-Logs | 1 Monat |

**Warum:** Art. 12 Abs. 3 setzt eine Frist von einem Monat ab Eingang, einmalig verlängerbar um zwei Monate bei komplexen Anfragen. Fristversäumnisse sind der häufigste Anlass für Beschwerden bei Aufsichtsbehörden. Bereite die Auskunfts-Query jetzt vor — dann ist die erste Anfrage eine Sache von zehn Minuten statt eines verlorenen Abends.

**Identitätsprüfung:** Anfragen nur an die im Konto hinterlegte E-Mail-Adresse beantworten. Auskunft an die falsche Person ist selbst eine Datenpanne.

---

### ☐ E-7 · Datenpannen-Prozess vorbereiten

**Was zu tun ist:** Notiz mit dem Meldeweg an den Landesbeauftragten für den Datenschutz und die Informationsfreiheit Baden-Württemberg (Online-Meldeformular, Adresse: Lautenschlagerstraße 20, 70173 Stuttgart) und einer Liste dessen, was eine Meldung enthalten muss.

**Warum:** Art. 33 setzt eine Frist von 72 Stunden ab Kenntnis. Diese Frist läuft auch am Wochenende. Sich erst im Ernstfall zu informieren, kostet die halbe Frist. Ab wann meldepflichtig: sobald ein Risiko für die Rechte und Freiheiten der Betroffenen besteht — etwa wenn eine fehlende RLS-Policy fremde Rezepte oder E-Mail-Adressen offengelegt hat. Bei hohem Risiko musst du zusätzlich die Betroffenen informieren (Art. 34).

---

### ☐ E-8 · Kein Cookie-Banner — und das ist korrekt so

**Was zu tun ist:** Nichts. Nur verstehen, warum.

**Warum:** § 25 Abs. 1 TDDDG verlangt Einwilligung für das Speichern von Informationen auf dem Endgerät. Abs. 2 Nr. 2 nimmt davon aus, was für einen vom Nutzer ausdrücklich gewünschten Dienst unbedingt erforderlich ist. Der AsyncStorage-Eintrag mit dem Session-Token ist genau das — ohne ihn wäre man bei jedem App-Start ausgeloggt. Die Website setzt weder Cookies noch LocalStorage-Tracking, lädt keine Drittinhalte und hostet die Poppins-Schrift selbst.

Du brauchst also weder ein Banner noch ein Consent-Tool. Der Entwurf sagt das ausdrücklich — das ist ein Verkaufsargument, kein Mangel.

---

# TEIL F — Nutzungsbedingungen

### ☐ F-1 · Eigene Terms of Use veröffentlichen

**Was zu tun ist:** Den Entwurf `terms-of-use-EN.md` auf der Website veröffentlichen und in der App verlinken.

**Warum, obwohl du nichts verkaufst:** Ohne eigene EULA gilt automatisch Apples Standard-Lizenzvertrag. Der regelt die Lizenz an der Software — aber nicht die vier Dinge, die bei dir wichtig sind:

1. **Mindestalter.** Löst den Konflikt aus B-5 und schafft die Grundlage gegenüber COPPA und Art. 8 DSGVO.
2. **Haftungsausschluss für Ernährungsbezug.** Deine App plant Mahlzeiten. Nutzer könnten Allergien, Unverträglichkeiten oder Nährwertangaben betreffende Erwartungen an die App richten. Ein klarer Hinweis, dass die App ein Organisationswerkzeug und keine Ernährungs- oder Gesundheitsberatung ist, gehört hinein.
3. **Keine Verfügbarkeitsgarantie.** Du betreibst das kostenlos in deiner Freizeit. Ohne entsprechende Klausel könnten Nutzer bei einem längeren Ausfall oder einer Einstellung des Dienstes Ansprüche geltend machen.
4. **Rechte an den Inhalten.** Klarstellen, dass die Rezepte den Nutzern gehören und du dir nur die technisch nötige Nutzung zum Betrieb einräumen lässt.

**Grenze, die du nicht überschreiten darfst:** Nach § 309 Nr. 7 BGB kannst du die Haftung für Vorsatz und grobe Fahrlässigkeit sowie für Schäden an Leben, Körper und Gesundheit nicht ausschließen. Klauseln, die das versuchen, sind unwirksam — und reißen im Zweifel die gesamte Haftungsregelung mit. Der Entwurf hält diese Grenze ein.

---

### ☐ F-2 · Footer der Website vervollständigen

**Was zu tun ist:** Drei Links im Footer von `website/index.html`: Legal Notice, Privacy Policy, Terms of Use.

---

# TEIL G — Rest vor der Einreichung

### ☐ G-1 · Namensrecherche für „foody" **⚖️**

**Was zu tun ist:** Kostenlose Recherche in DPMAregister (`register.dpma.de`) und im EUIPO eSearch plus (`euipo.europa.eu`) nach „foody" in Nizza-Klasse 9 (Software) und 42 (Softwaredienstleistungen).

**Warum:** „foody" ist ein naheliegender Name im Lebensmittelbereich, und es existieren mit hoher Wahrscheinlichkeit eingetragene Marken in diese Richtung. Markenrecht kennt kein Verschulden: Auch wer eine fremde Marke gutgläubig und ohne Einnahmen nutzt, kann auf Unterlassung in Anspruch genommen werden — mit Kosten, die den Rahmen eines Hobbyprojekts sprengen. Ein Rebranding vor dem Launch kostet dich einen Nachmittag, nach dem Launch verlierst du Nutzer, Domain, App-Store-URL und Rezensionen.

Eine eigene Markenanmeldung brauchst du nicht (Grundgebühr DPMA ab 290 €, für ein kostenloses Projekt unverhältnismäßig). Es geht ausschließlich um die Kollisionsprüfung.

**Fertig, wenn:** Recherche durchgeführt, Treffer bewertet, Ergebnis notiert.

---

### ☐ G-2 · Store-Texte auf Konsistenz prüfen

**Was zu tun ist:** Beschreibung, Screenshots und Keywords darauf durchsehen, dass sie keine Funktionen bewerben, die nicht existieren — insbesondere kein Teilen von Rezepten und keine Community-Funktion.

**Warum:** Guideline 2.3 (Accurate Metadata) führt zu Ablehnung, wenn Beschreibung und App auseinanderfallen. Und aus Datenschutzsicht: Was du in der Beschreibung versprichst, muss die Datenschutzerklärung abdecken.

---

### ☐ G-3 · Barrierefreiheit — derzeit nicht anwendbar

**Was zu tun ist:** Nichts. Nur zur Kenntnis für später.

**Warum:** Das Barrierefreiheitsstärkungsgesetz gilt seit dem 28. Juni 2025 für Dienstleistungen im elektronischen Geschäftsverkehr gegenüber Verbrauchern. Es setzt eine Geschäftstätigkeit voraus — eine kostenlose, nicht-kommerzielle App fällt nicht darunter. Zusätzlich greift die Kleinstunternehmen-Ausnahme. **Sobald du monetarisierst, ändert sich das:** Dann werden die Anforderungen an Kontraste, Bedienbarkeit und VoiceOver-Unterstützung relevant. Wenn du iOS-Standardkomponenten verwendest, bist du technisch ohnehin nah dran — es lohnt sich, das nicht zu verbauen.

---

### ☐ G-4 · Rechtsdokumente versionieren

**Was zu tun ist:** Alle Rechtstexte mit Datum und Versionsnummer im Repo ablegen, Änderungen über Commits nachvollziehbar halten.

**Warum:** Im Streitfall musst du beweisen können, welche Fassung zu welchem Zeitpunkt galt. Bei einer Beschwerde, die sich auf einen sechs Monate alten Sachverhalt bezieht, ist ein Git-Log das beste Beweismittel, das du haben kannst.

---

# TEIL H — Nach dem Launch

### ☐ H-1 · Trader-Status bei Monetarisierung sofort umstellen

Sobald du einen Preis, In-App-Käufe, ein Abo oder Werbung einführst, wirst du zum Trader. <cite index="9-1">Als Trader musst du Name, Anschrift, Telefonnummer und E-Mail-Adresse in App Store Connect angeben, und Apple zeigt diese Kontaktdaten auf deiner EU-Produktseite an — einschließlich der Telefonnummer, die sich nicht ausblenden lässt.</cite> <cite index="9-1">Wenn die Anzeige einer privaten Telefonnummer ein Problem ist, verwende eine geschäftliche Nummer und Adresse.</cite> Praktisch heißt das: Bei Monetarisierung brauchst du eine Geschäftsadresse und eine separate Telefonnummer — oder du akzeptierst, dass beides öffentlich wird. Plane das mit ein, bevor du monetarisierst, nicht danach.

### ☐ H-2 · Datenschutzerklärung bei jeder Feature-Änderung mitziehen

Neue Verarbeitung heißt neuer Absatz. Besonders relevant: das Aktivieren des Rezepte-Teilens (macht Inhalte öffentlich), Push-Benachrichtigungen (Device-Tokens), Crash-Reporting, jede Form von Analytics.

### ☐ H-3 · Jährlicher Check

Einmal im Jahr: RLS-Policies erneut abfragen (A-2), DPAs auf Änderungen prüfen, Apple Developer Program verlängern (99 €), Rechtstexte durchsehen.

### ☐ H-4 · Kontakt-Postfach überwachen

`service@foodytheapp.com` gehört in dein tägliches Postfach, nicht in einen Ordner, den du monatlich prüfst. Hier laufen Betroffenenanfragen, Apple-Nachrichten und im Ernstfall Behördenpost ein.

---

## Reihenfolge für die Umsetzung

**Zuerst, weil alles andere davon abhängt:** A-1 bis A-3 (Region, RLS, Bucket) — sie bestimmen, was in den Rechtstexten stehen darf.

**Dann die Code-Änderungen:** A-4 bis A-11.

**Dann die Texte:** D-1, D-2, E-1, F-1 (Entwürfe liegen bei), Website-Footer.

**Dann die Verträge und Doku:** E-2 bis E-7.

**Dann App Store Connect:** B-1 bis B-6.

**Parallel jederzeit:** C-1 bis C-3, G-1.

Der einzige Punkt, der externe Wartezeit erzeugt, ist die Markenrecherche, falls sie einen Treffer liefert. Alles andere hast du selbst in der Hand.
