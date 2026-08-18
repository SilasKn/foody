# Privacy Policy

*Draft · Version 1.0 · 18 August 2026 · applies to foody iOS app v1.0.3 and foodytheapp.com*

> **Instructions before publishing — remove this block afterwards**
>
> Placeholders marked `[…]` and paragraphs marked **[DECIDE]** must be resolved before this goes live. Each corresponds to a checklist item:
>
> - **§3.1 username derivation** — delete this paragraph once checklist item A-4 is done. Keep it if you leave the email-derived username in place.
> - **§3.4 photos / EXIF** — the wording is deliberately neutral. After the test in A-8, you may replace it with a positive statement if the test confirms EXIF is stripped.
> - **§3.6 ingredient catalogue** — delete this paragraph once A-6 is done.
> - **§5 Netlify transfer** — after checking A-3 / E-3, keep either the DPF sentence or the SCC sentence, not both.
> - **§4 sharing** — this policy deliberately says nothing about publishing recipes, because that feature is disabled. Add it when you enable it.
> - Confirm the Supabase region wording in §5 matches your screenshot from A-1.
>
> Publish at `foodytheapp.com/privacy-policy` and link it both from the website footer and from inside the app (App Review Guideline 5.1.1).

---

## 1. Who is responsible for your data

The controller within the meaning of Article 4(7) of the General Data Protection Regulation (GDPR) is:

Silas Knapp
Rosenweg 6/2
72581 Dettingen an der Erms
Germany
Email: service@foodytheapp.com

foody is a non-commercial project run by a private individual and offered free of charge. There is no company behind it. No data protection officer has been appointed, as the conditions of Article 37 GDPR are not met.

## 2. The short version

- You need an account to use foody. That account requires an email address and a password. Nothing else is mandatory.
- Everything else stored about you is content you created yourself: recipes, ingredients, meal plans and photos.
- **There is no analytics, no tracking, no crash reporting and no advertising in this app.** No advertising identifier is read, and no data is shared with advertising networks or data brokers.
- Your data is never sold or passed on for anyone else's purposes.
- You can delete your account, including all stored photos, yourself at any time from within the app.
- The website sets no cookies and embeds no third-party content.

The sections below set out the detail required by Articles 13 and 14 GDPR.

## 3. What is processed, why, and on what legal basis

### 3.1 Creating an account

**Data:** email address; password (stored only as a bcrypt hash, never in plain text); a display name if you choose to provide one; the time your account was created.

**Purpose:** to create and operate your user account. foody cannot be used without an account, because all your content is tied to it.

**Legal basis:** Article 6(1)(b) GDPR — performance of a contract. Providing this data is necessary to use the app; without it, no account can be created and the app cannot be used.

**Retention:** until you delete your account.

**[DECIDE — delete this paragraph after checklist A-4]** If you do not provide a display name, the part of your email address before the `@` symbol is used as your display name. If your email address contains your real name, that name may become visible to other users in future versions of the app. You can avoid this by choosing a display name during registration.

### 3.2 Verifying your email address and signing in

**Data:** email address, a short-lived confirmation token, your email address and password when you sign in, session tokens, and the time of your last sign-in.

**Purpose:** to confirm that the address belongs to you, to protect against misuse of third-party addresses, and to keep you signed in.

**Legal basis:** Article 6(1)(b) GDPR for authentication; Article 6(1)(f) GDPR — legitimate interest — for the abuse-prevention element of email verification. The legitimate interest is preventing accounts being created with email addresses that belong to other people.

**Retention:** confirmation tokens are short-lived; session data until you sign out or delete your account.

### 3.3 Data stored on your own device

When you sign in, the app stores your session on your device so that you do not have to sign in again each time. This includes your access token, your refresh token, the expiry time, and your user record: your ID, your email address, your display name and timestamps.

This is stored in the app's own sandbox, which other apps cannot read. It is **not** stored in the iOS Keychain and is not additionally encrypted by the app beyond the protection the operating system provides. It is never transmitted anywhere. It is removed when you sign out or delete the app.

**Legal basis:** Article 6(1)(b) GDPR. Under § 25(2)(2) of the German Telecommunications Digital Services Data Protection Act (TDDDG), storing this information does not require consent, because it is strictly necessary to provide the service you have expressly requested — without it you would be signed out every time you closed the app.

### 3.4 Recipes, ingredients and photos

**Data:** recipe names, descriptions, servings, ingredient names, quantities and units, and any photos you add. For photos, the following is also stored: your user ID, the file path, the image dimensions, and the associated recipe.

**Purpose:** to provide the core function of the app — storing and displaying your recipes.

**Legal basis:** Article 6(1)(b) GDPR.

**How photos are handled:** photos are selected from your photo library. The app does not access your camera. Photos are cropped and re-encoded before upload. They are stored in a private storage area and can only be retrieved through temporary links that expire after one hour. They are never publicly accessible.

**Retention:** until you delete the recipe or your account. Photos are deleted together with their recipe.

**Please note:** the free-text fields are yours to fill. Please do not enter special category data within the meaning of Article 9 GDPR — for example health information, allergies or religious dietary requirements — in recipe names or descriptions. The app is not designed to process such data.

### 3.5 Meal planning

**Data:** which recipe you have planned, for which date, for which meal, and for how many servings. Also a "last eaten" date derived from your plan, used to make suggestions.

**Purpose:** the calendar and suggestion functions.

**Legal basis:** Article 6(1)(b) GDPR for the calendar; Article 6(1)(f) GDPR for the suggestion function, the legitimate interest being to make the app more useful by not suggesting the same meal repeatedly. You may object to this at any time under Article 21 GDPR.

**Retention:** plan entries in the past are **deleted automatically** every time you open the calendar. Nothing is kept about what you ate before today, apart from the "last eaten" date on the recipe itself.

**Note:** your shopping list is calculated on your device from your plan and your recipes. It is not stored separately anywhere.

### 3.6 **[DECIDE — delete this paragraph after checklist A-6]** Shared ingredient catalogue

Ingredient names you type are added to a shared catalogue used to offer suggestions to all users. These entries are not linked to your account and contain no identifying information about you. Because they are not linked to any user, they are **not** deleted when you delete your account. Please do not enter personal information in ingredient names.

### 3.7 Server logs

**Data — website:** when you visit foodytheapp.com, the hosting provider records your IP address, the time of access, your browser identification and the resource requested.

**Data — app backend:** the backend provider records technical logs of authentication events, which include IP addresses.

**Purpose:** operating and securing the infrastructure, and detecting attacks and abuse.

**Legal basis:** Article 6(1)(f) GDPR. The legitimate interest is the secure and stable operation of the service, in particular defence against automated attacks.

**Retention:** according to the providers' own retention periods. These logs are **not** deleted when you delete your account, because they are not stored per user account.

You may object to this processing under Article 21 GDPR. Please note that operating the service without any technical logging is not possible; an objection will be assessed on its merits.

## 4. What does not happen

The following statements are verifiable in the app's source code:

- **No analytics, no tracking, no crash reporting, no advertising.** No such software is present in the app.
- **No advertising identifiers and no cross-app tracking.** The advertising identifier is never requested; the app never asks for tracking permission because it does not track.
- **No push notifications and no device tokens.**
- **No access to your location, contacts, calendar, microphone or camera.**
- **No profiling and no automated decision-making** within the meaning of Article 22 GDPR.
- **No sale or disclosure of your data to third parties** for their own purposes.
- **No network connections** other than to the app's own backend.
- **Website:** no cookies, no local storage used for tracking, no analytics, no embedded third-party content. The typeface is served from our own servers, not from a third-party font service. A strict Content Security Policy is applied.
- **No payment data.** foody is free of charge and contains no in-app purchases.
- Your recipes are visible only to you. There is no function to publish or share them with other users.

## 5. Who else processes your data

| Provider | Role | What they process | Location |
|---|---|---|---|
| Supabase | Processor under Art. 28 GDPR | account, recipe, ingredient, plan and image data; authentication logs; verification and password-reset emails | European Union |
| Netlify | Processor under Art. 28 GDPR | delivery of foodytheapp.com; server logs including IP addresses | United States |
| Apple | Independent controller | distribution of the app via the App Store | see Apple's own privacy policy |

A data processing agreement pursuant to Article 28(3) GDPR is in place with each processor.

**Where your data is stored:** all account data, recipes, ingredients, meal plans and photos are stored on servers **within the European Union**. No transfer to a third country takes place for this data.

**Transfers to the United States:** the website is delivered by a provider based in the United States. This affects only the server logs described in section 3.7 — not your account data or your content. **[DECIDE — keep one]** *This transfer is based on the European Commission's adequacy decision for the EU-US Data Privacy Framework pursuant to Article 45 GDPR, under which the provider is certified.* / *This transfer is safeguarded by the European Commission's Standard Contractual Clauses pursuant to Article 46(2)(c) GDPR. A copy is available on request.*

**Apple** processes your Apple account data, downloads and any crash reports at its own level and on its own responsibility. This is not accessible to us and is governed by Apple's privacy policy.

## 6. Your rights

Under the GDPR you have the right to:

- **Access** (Art. 15) — ask what data is held about you. Write to service@foodytheapp.com from the address registered to your account.
- **Rectification** (Art. 16) — have inaccurate data corrected. Recipes, ingredients, plans and your password can be changed in the app. **[DECIDE — delete after A-5]** *Your display name currently has to be changed by request to the address above.*
- **Erasure** (Art. 17) — have your data deleted. You can do this yourself: Settings → Delete Account. This permanently deletes your account, all recipes, ingredients assigned to them, meal plans and all uploaded photos. The exceptions are described in sections 3.6 and 3.7.
- **Restriction of processing** (Art. 18).
- **Data portability** (Art. 20) — receive your data in a machine-readable format. Please request this by email.
- **Object** (Art. 21) — object to processing based on legitimate interests, namely the processing described in sections 3.5 and 3.7.
- **Withdraw consent** at any time, where processing is based on consent. Withdrawal does not affect the lawfulness of processing carried out beforehand.

Requests are answered within one month. Where a request is complex, this may be extended by a further two months, in which case you will be informed.

To protect your data, requests are only answered to the email address registered to the account concerned.

## 7. Right to complain

You may lodge a complaint with a data protection supervisory authority. The authority responsible for the controller is:

Der Landesbeauftragte für den Datenschutz und die Informationsfreiheit Baden-Württemberg
Lautenschlagerstraße 20
70173 Stuttgart
Germany
https://www.baden-wuerttemberg.datenschutz.de

You may also complain to the supervisory authority of your own place of residence or work.

## 8. Children

foody is not directed at children. Under the Terms of Use, you must be at least 16 years old to create an account. No data is knowingly collected from children below that age. If you believe a child has created an account, please contact service@foodytheapp.com and the account will be deleted.

## 9. Changes to this policy

This policy will be updated when the app changes in a way that affects how data is processed. The current version is always available at foodytheapp.com/privacy-policy and in the app. Substantial changes will be communicated within the app.

*Version 1.0 — 18 August 2026*
