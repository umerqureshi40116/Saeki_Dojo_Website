# Saeki Dojo — website prototype

A design prototype for [Saeki Dojo / Ottawa JKA Canada](https://www.ottawajka.com), a
non-profit Shotokan karate dojo on Cambridge Street South in Ottawa, established 1973.

Built as a static site — **HTML, CSS and vanilla JavaScript only**. No framework, no
build step, no dependencies.

## Running it

The site uses extensionless URLs (`/about`, not `/about.html`) to match Vercel's
`cleanUrls`. Plain `python -m http.server` cannot resolve those, so use the included
dev server, which mirrors the deploy exactly:

```bash
python serve.py          # http://127.0.0.1:5173
```

`npx serve` and `vercel dev` also handle clean URLs correctly. Opening files directly
via `file://` will **not** work now that links are extensionless.

Fonts load from Google Fonts, so keep a network connection for the intended typography.
Everything else is local.

## Structure

```
index.html          Home
about.html          History, leadership, philosophy
programs.html       Youth and adult programs, timetable, FAQ
membership.html     Rates, joining, registration
events.html         Upcoming events + filterable gallery
blog.html           Journal and podcast
contact.html        Contact form, map, directions

assets/css/style.css   Single stylesheet
assets/js/main.js      All interaction, ~20 self-contained modules
assets/img/            Site imagery (JPEG/PNG + WebP for each)
assets/video/          Drop hero.mp4 here — see below
```

## Features

Preloader, page transitions, custom cursor, scroll-reveal animations, parallax, count-up
statistics, a scroll-drawn history timeline, tabbed schedules, a monthly/yearly pricing
toggle, a filterable gallery with keyboard-navigable lightbox, accordions, a testimonial
carousel, and a validated contact form.

All motion respects `prefers-reduced-motion`. Layout is responsive to ~400px.

### Hero video

The hero runs a Ken Burns photo slideshow by default. Drop a file at
`assets/video/hero.mp4` and it fades in and takes over automatically — no code change.
Recommended: 1920×1080, H.264, 8–15s, silent, under ~8 MB.

### Images

Every image ships as both JPEG/PNG and WebP, wrapped in `<picture>` with explicit
`width`/`height` so nothing shifts as the page loads.

## Deploying to Vercel

No build step. Import the repo and accept the defaults:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Build Command | *(empty)* |
| Output Directory | `./` |
| Install Command | *(empty)* |

`vercel.json` handles the rest: clean URLs, a year-long immutable cache on images,
revalidation on CSS/JS, security headers, and `X-Robots-Tag: noindex`.

### This deploy is intentionally not indexable

It is a prototype, so it should not compete with — or be mistaken for — the dojo's real
site. Three layers enforce that: a `noindex, nofollow` meta tag on every page, the
`X-Robots-Tag` header, and `Disallow: /` in `robots.txt`. Link previews and Open Graph
cards still work normally; only search crawling is blocked.

To make it a real public site: remove the meta tag from each page, drop the
`X-Robots-Tag` header from `vercel.json`, restore `robots.txt` (the sitemap line is
commented out, ready), and set the production domain everywhere (see below).

## Before deploying

- [ ] **Set the real domain.** Open Graph tags and the JSON-LD block currently use
      `https://saeki-dojo-website.vercel.app`. If your Vercel project name differs, this
      needs updating; `sitemap.xml` still points at the production domain.
- [ ] **Verify the geo coordinates** in the JSON-LD on `index.html` (currently
      approximate: 45.4045, −75.6965).
- [ ] **Connect the contact form.** `contact.html` posts to
      `https://formspree.io/f/YOUR_FORM_ID` — replace with a real endpoint or it stays
      in demo mode.
- [ ] **Replace placeholder copy.** Testimonials, journal articles and podcast episodes
      are written placeholders, not real content. Nine `href="#"` links have no
      destination yet.

## Content accuracy

Names, ranks, biographies, class times, prices, event dates and contact details are taken
from the dojo's own site. Photography is theirs. Marketing copy, FAQ answers, testimonials
and journal posts were written for this prototype and are not the dojo's words.

## Licence

Prototype for demonstration. Photography and brand assets belong to Ottawa JKA Canada Inc.
