# Atomix website

The public site for Atomix: features, the development roadmap, a server sizing and cost calculator, and a comparison with Elasticsearch. It is a static page served by GitHub Pages.

- `index.html` — the page
- `assets/styles.css` — styles, using the Atomix app's own colour tokens (Nord dark and slate light)
- `assets/app.js` — navigation, carousel, sticky roadmap steps and the sizing calculator
- `assets/data.js` — **every number the calculator uses**: provider plans and prices, compression ratios, Elasticsearch sizing assumptions and the source links

## Updating prices

Edit `assets/data.js`. Each provider has a list of plans (`vcpu`, `ram` in GB, `disk` in GB of usable local storage, monthly `price`), a `diskRate` (extra storage per GB-month), an `objectRate` (S3-style storage per GB-month) and an `esNode` (the plan used for one Elasticsearch data node). Update `asOf` when you do.

## Running locally

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8080
```

## Deploying

Every push to `main` is published by GitHub Pages from the repository root.
