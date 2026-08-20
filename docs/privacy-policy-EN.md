# Privacy Policy

*Version 1.1 · 20 August 2026 · applies to foody iOS app v1.0.3 and foodytheapp.com*

## 1. Controller

Silas Knapp
Email: service@foodytheapp.com
Postal address: see the Legal Notice.

## 2. What is processed, why, and on what legal basis

| Purpose | Data | Legal basis | Retention |
|---|---|---|---|
| Creating and operating your account | email address; password (stored only as a bcrypt hash); a display name you choose; the time your account was created | Art. 6(1)(b) GDPR | until you delete your account |
| Verifying your email address and signing in | email address, a short-lived confirmation token, session tokens, the time of your last sign-in | Art. 6(1)(b) GDPR; Art. 6(1)(f) for the abuse-prevention element — the legitimate interest is preventing accounts being created with email addresses belonging to other people | tokens are short-lived; session data until you sign out or delete your account |
| Keeping you signed in, on your own device | access token, refresh token, expiry time, your ID, email address and display name — held in the app's own sandbox, **not** in the iOS Keychain and not additionally encrypted by the app; never transmitted anywhere | Art. 6(1)(b) GDPR. Under § 25(2)(2) TDDDG this needs no consent, being strictly necessary for the service you requested | removed when you sign out or delete the app |
| Storing your recipes, ingredients and photos | names, descriptions, servings, ingredient names, quantities, units; photos together with your user ID, file path and image dimensions. Photos come from your photo library — the app does not access your camera — and are cropped and re-encoded before upload, stored privately and retrievable only through links that expire after one hour | Art. 6(1)(b) GDPR | until you delete the recipe or your account; photos are deleted with their recipe |
| Meal planning and suggestions | which recipe you planned, for which date, meal and number of servings; a "last eaten" date derived from your plan | Art. 6(1)(b) GDPR for the calendar; Art. 6(1)(f) for suggestions — the legitimate interest is not suggesting the same meal repeatedly | plan entries in the past are **deleted automatically** every time you open the calendar |
| Operating and securing the infrastructure | website: IP address, time of access, browser identification, resource requested. App backend: technical logs of authentication events, including IP addresses | Art. 6(1)(f) GDPR — the legitimate interest is secure and stable operation, in particular defence against automated attacks | the providers' own retention periods. These logs are not stored per account and are therefore **not** deleted when you delete yours |

## 3. Who else processes your data

| Provider | Role | What they process | Location |
|---|---|---|---|
| Supabase | Processor under Art. 28 GDPR | account, recipe, ingredient, plan and image data; authentication logs; verification and password-reset emails | European Union |
| Netlify | Processor under Art. 28 GDPR | delivery of foodytheapp.com; server logs including IP addresses | United States |
| Apple | Independent controller | distribution of the app via the App Store | see Apple's own privacy policy |

A data processing agreement pursuant to Article 28(3) GDPR is in place with each processor.

All account data, recipes, ingredients, meal plans and photos are stored on servers **within the European Union**.

The website is delivered from the United States. This affects only the server logs described above, not your account data or your content. The transfer is based on the European Commission's adequacy decision for the EU-US Data Privacy Framework pursuant to Article 45 GDPR, under which the provider is certified.

## 4. Your rights

You have the right to **access** (Art. 15), **rectification** (Art. 16), **erasure** (Art. 17), **restriction of processing** (Art. 18), **data portability** (Art. 20) and to **object** (Art. 21) to the processing based on legitimate interests described above.

Recipes, ingredients, plans, your display name and your password can be changed in the app. You can erase everything yourself under Settings → Delete Account; this permanently deletes your account, recipes, ingredient names, meal plans and photos, with the exception of the server logs described above.

For anything else, write to service@foodytheapp.com. To protect your data, requests are answered only to the email address registered to the account concerned, and within one month.

You may lodge a complaint with a data protection supervisory authority, in particular in the Member State of your habitual residence, place of work or place of the alleged infringement.

Account data is required to use foody: without it, no account can be created and the app cannot be used.

No automated decision-making within the meaning of Article 22 GDPR takes place.

## 5. Children

foody is not directed at children. Under the Terms of Use you must be at least 16 years old to create an account. If you believe a child has created an account, please contact service@foodytheapp.com and it will be deleted.

## 6. Changes to this policy

This policy is updated when the app changes in a way that affects how data is processed. The current version is always available at foodytheapp.com/privacy-policy and in the app.
