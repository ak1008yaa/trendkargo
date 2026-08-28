# AGENTS.md

## Project overview

This repository is a static storefront for a Persian-language cargo/import business named Trend Cargo. It is not a framework application; the site is served as plain HTML, CSS, and JavaScript files from the project root.

Primary entry points:

* index.html
* admin.html
* invoice.html
* js/script.js
* css/style.css
* vercel.json

## Working conventions for this project

* Keep the project static-site friendly. Prefer lightweight vanilla JavaScript and CSS instead of introducing frameworks or build tools unless a task explicitly requires them.
* Preserve the existing Persian RTL design, visual language, and conversion-focused UX. Most of the site content and UI labels are in Persian.
* Respect the current DOM structure and IDs/classes used by the UI scripts. Many actions are wired to specific elements in index.html and admin.html.
* Local storage is the app state layer. Product lists, exchange-rate cache, invoice records, last invoice, theme setting, and Google Sheet URL are all stored in browser storage. Maintain compatibility with current keys and payload shapes.
* Do not break the PWA or install flow, WhatsApp contact flows, or the static hosting rules in vercel.json without a clear reason.

## Common workflows

* Serve locally for manual QA: `python -m http.server 8000`
* Package the static site for distribution: `python pack_project.py`
* No automated frontend test suite is configured here. Validate changes by opening the site in a browser and checking the affected page flow and browser console.

## Important files

* js/script.js: product catalog, exchange-rate fetch logic, theme handling, modal behavior, calculation widgets, and localStorage persistence.
* admin.html: admin dashboard for product management, invoice creation, discounts, and settings.
* invoice.html: printable invoice preview page.
* sw.js: service worker cache configuration; update the cache version when changing static assets.
* vercel.json: hosting routes and security headers.

## Project-specific rules

* Maintain Persian labels and RTL/number styling for the storefront experience.
* Keep product data schema consistent: id, category, catName, title, price, rawPrice, tag, mainImg, gallery, desc, specs.
* When editing theme logic, update both the HTML data-theme state and the JavaScript theme toggle behavior.
* When updating invoice or accounting logic, preserve compatibility with existing localStorage keys and saved structures.
* When editing UI, prefer small targeted changes that match the existing style and spacing patterns instead of rewriting large sections.

## Preferred implementation style

* Favor surgical edits over broad refactors.
* Keep scripts readable and browser-safe; this project relies on direct DOM access and small utility functions.
* Preserve user-facing behavior such as live pricing, product modal interactions, invoice generation, and the custom order flow.

## Default assumptions for AI coding agents

* The user is likely working on a static marketing + storefront website, not a backend service.
* Any change should be safe for direct static hosting and safe for local browser use without a package install step.
* If a request would require framework setup, bundling, or server-side code, confirm that requirement before proceeding.


