# VoiceBill

**VoiceBill** është një aplikacion inovativ mobil, i dizajnuar posaçërisht për zejtarë (elektricistë, hidraulikë, mekanikë, etj.). 

Aplikacioni i lejon zejtarët të regjistrojnë me zë punët që kanë kryer gjatë ditës, ndërsa Inteligjenca Artificiale (AI) e përpunon audio-regjistrimin dhe gjeneron automatikisht faturën e strukturuar gati për t'u dërguar klientit.

## Veçoritë Kryesore
* **Regjistrim me Zë:** Fjalët e lira të zejtarit kthehen në të dhëna të sakta.
* **Përpunim me AI:** Nxjerrja automatike e klientit, artikujve, sasisë dhe çmimeve në format të faturës.
* **Gjenerim i Faturave:** Krijimi i shpejtë i raporteve dhe faturave profesionale nga telefoni.

## Konfirmimi i emailit

Regjistrimi kërkon konfirmimin e adresës. Lidhja e konfirmimit e hap VoiceBill dhe, pas verifikimit të suksesshëm, përdoruesi kalon te aplikacioni. Për ta aktivizuar në projektin e hostuar:

1. Te Supabase **Authentication > URL Configuration**, vendos **Site URL** në `voicebill://auth/callback` (jo `localhost`) dhe te **Redirect URLs** lejo `voicebill://auth/callback`. Për zhvillim me Expo Go mund të lejosh edhe `exp://**/--/auth/callback` dhe `https://**.on.expo.app/--/auth/callback`; përdor wildcard-et vetëm për testim, sepse hosti i Expo Go/tunnel-it ndryshon.
2. Te **Authentication > SMTP Settings**, aktivizo Custom SMTP dhe përdor hostin `smtp.gmail.com`, portin `587`, adresën Gmail të dërguesit dhe një Google App Password. App Password krijohet në Google pasi të aktivizohet verifikimi me dy hapa.
3. Mbaje template-in e konfirmimit të Supabase me `{{ .ConfirmationURL }}` që Supabase ta verifikojë emailin dhe të ridrejtojë te VoiceBill.

Mos vendos App Password në aplikacion, repository ose `.env`; kredencialet SMTP ruhen vetëm në cilësimet e Supabase. `supabase/config.toml` konfiguron projektin lokal dhe nuk ndryshon cilësimet e projektit të hostuar.