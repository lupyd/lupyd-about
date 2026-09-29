## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)


## SEO, Metadata & Schema Compliance

All future changes — by humans, CI, or AI agents — MUST preserve SEO,
metadata integrity, and schema validity. Violations block merge.

- **SEO:** keep unique `<title>` and `<meta name="description">`; do not
  break canonical URLs, heading hierarchy, `sitemap.xml`, or `robots.txt`.
- **Metadata:** keep `name`, `version`, `description`, `license`,
  `repository`, and `keywords` in the package manifest accurate; update
  `CITATION.cff`, `llms.txt`, and Open Graph tags on release.
- **Schema:** all JSON-LD MUST validate at https://validator.schema.org;
  OpenAPI (if present) MUST validate against 3.1; docs MUST NOT contradict
  schema fields.
- **Enforcement:** run `seo:check`, `schema:validate`, and `metadata:lint`
  before commit. If a rule cannot be satisfied, open an issue instead of
  merging a regression.
