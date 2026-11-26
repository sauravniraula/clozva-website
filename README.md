# CLOZVA · Drop 001

A U.S. Nuxt 4 storefront for CLOZVA foam clogs. Shop Classics, Platforms, Trail, and the Charm Edit; browse markdowns on the Sale tab. Each product page supports color, EU size, and quantity selection. The bag is saved in the browser. The server prices new orders in integer U.S. cents, validates U.S. state and ZIP fields, and saves preview orders and newsletter signups in SQLite. Standard domestic shipping is $6.95 or free on orders of $75 or more.

## Run locally

Requires Node 24 or later.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 3100
```

Open <http://127.0.0.1:3100>. For a production build and local preview:

```sh
npm test
npm run typecheck
npm run build
HOST=127.0.0.1 PORT=3100 npm start 
```

SQLite is the local default. Set `CLOZVA_DB_PATH` to an absolute path to override `.data/clozva.sqlite`, or set a server-side `DATABASE_URL` to use PostgreSQL. Stock is seeded once per size and decremented when orders are placed. The preview does not process payments, send emails or ship products. Before accepting real orders, connect fulfillment and payments and finalize the catalog and policies.

## CI/CD on Netlify

1. In [Netlify](https://app.netlify.com/start), choose **Import an existing project → GitHub** and select `clozva/clozva-website`. Authorize the Netlify GitHub App for this repository if it does not appear.
2. Set `main` as the production branch. `netlify.toml` supplies Node 24, the Nitro Netlify preset, the test/type-check/build command, and the publish directory. Netlify handles production deploys on pushes and Deploy Previews on pull requests after the link is established. GitHub Actions independently tests SQLite and PostgreSQL, type-checks, builds the Netlify bundle, and smoke-tests its handler.
3. For working checkout and newsletter signups, provision a dedicated PostgreSQL database. Add its pooled, TLS-enabled connection URL as the secret `DATABASE_URL` in Netlify's environment variables, available to **Functions** in **Production**. The database role needs permission to create the store tables. Use a separate database for preview contexts, or leave the variable unset there to make those previews browse-only. Existing local SQLite data is not uploaded or migrated automatically.
4. Deploy, then check `/api/store-status`: `checkout: true` indicates storage is configured. Place a sample order and reload the confirmation to verify real storage. Without PostgreSQL, Netlify will still serve the catalog but will not claim to save orders or signups.

To exercise the PostgreSQL test locally, point `TEST_DATABASE_URL` at a disposable database and run `npm test`. The test writes fixture data.

## Search and sharing

`/sitemap.xml` lists the home, shop, collection, sale, product, and informational pages. Product and collection URLs come from the shared catalog, and `/robots.txt` points crawlers to the sitemap. Checkout, receipts, internal search, and combined sale and collection filters carry `noindex` directives.

The sitemap, canonical URLs, and social previews use Netlify’s primary site address by default. Set `NUXT_PUBLIC_SITE_URL` to the preferred production origin, such as `https://www.example.com`, to override it. Outside Netlify, the request origin is used when no override is set. Once deployed, submit `/sitemap.xml` for the production domain in Google Search Console.

Product pages publish structured data for the catalog and breadcrumbs. Merchant offer markup is reserved for when the storefront accepts payments and fulfills orders.

## Assets

- `/brand` provides four downloadable logo variants in SVG and PNG exports at 256, 512, and 1024 px wide. Files are in `public/brand/`.
- `public/images/` contains 13 campaign, catalog, and editorial photos plus four feature graphics, generated with Runware’s `openai:gpt-image@2.6-sunburst` model. These are concept images, not verified production product photos.
- To regenerate selected photos, run `python3 scripts/generate-images.py --help` and pass the names of the shots you want. This needs ImageMagick and a Runware key in `RUNWARE_API_KEY` or entered at the hidden prompt. It makes one paid request per shot. No key is needed to run the store.
- To regenerate logos after `npm ci`, install `fonttools` and `brotli` in a Python virtual environment and run `python scripts/export-logos.py` with ImageMagick on `PATH`.
