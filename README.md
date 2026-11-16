# Dare Ministries website

The website for [dareministries.org](https://dareministries.org): a fast, static site with no CMS, hosted on GitHub Pages. DNS is managed at Bluehost (four A records to GitHub Pages, and `www` as a CNAME to `bubster4920.github.io`); the custom domain is stored in `CNAME`.

## Pages

| Path | Page |
|---|---|
| `/` | Home |
| `/about/` | Story, mission & vision, beliefs, team |
| `/ministries/` | All ministries |
| `/ministries/conferences/` | Conference timeline, 2015 onward |
| `/ministries/college/` | College Bible study |
| `/ministries/worship/` | Worship collective & internship |
| `/ministries/podcast/` | Yet I Will Rejoice |
| `/ministries/uganda/` | Uganda youth conference + sponsor calculator |
| `/resources/` | Study library, apologetics, blog, care |
| `/blog/` | All blog posts (generated from `src/posts/`) |
| `/resources/blog/<post>/` | Individual blog posts (13 articles carried over from the old site) |
| `/give/` | Giving funds |
| `/connect/` | Contact form, emails, map |
| `/privacy/` | Privacy policy |

## Editing

Page content lives in `src/pages/*.html`; blog posts are plain-text files in `src/posts/` (a `key: value` header, a `---` line, then paragraphs; `## ` makes a heading, `> ` a quote, `[text](url)` a link) and are turned into pages by the same build; the shared header and footer live in `src/layout.html`.
After editing, rebuild the HTML:

```sh
python3 tools/build.py
```

Then commit both `src/` and the generated folders. Pushing to `main` deploys automatically (see `.github/workflows/pages.yml`). Photos and logos from the old WordPress site live in `assets/img/old-site/` (copied by the `fetch-images` workflow from `tools/remote-images.txt`).

Styles: `assets/css/style.css` (colors and fonts are CSS variables at the top). Interactions: `assets/js/main.js` (no dependencies).

Forms and giving hand off to Breeze ChMS (`dareministries.breezechms.com`). The contact form opens the visitor's email app, since a static site has no server.

## Research

`docs/SITE_INVENTORY.md` is the audit of the old site this redesign is based on.
