# Code Citations

## License: unknown
https://github.com/piroor/treestyletab/blob/c75c14fd5f29a33adb64ed62b299c881333409c7/webextensions/common/common.js

```
Both fixes from the previous session are still in [js/cms-loader.js](js/cms-loader.js). There's nothing left to change — the file is already correct. Here's the full explanation:

---

## What was wrong and how it was fixed

### Fix 1 — Stale HTTP cache (line 73)

```js
// BEFORE — broken
fetch(url, {cache: 'force-cache'})

// AFTER — fixed
fetch(url, {cache: 'default'})
```

`force-cache` tells the browser to serve a cached response forever, bypassing the server entirely. If Sanity was ever queried before any products existed, the browser cached that empty result and kept serving it on every subsequent visit. Changing to `'default'` lets the browser revalidate the response normally.

---

### Fix 2 — GROQ null comparison bug (lines 154 & 169)

```js
// BEFORE — broken (category pages)
*[_type == "product" && available != false && page == $page]

// AFTER — fixed (all three product queries now consistent)
*[_type == "product" && coalesce(available, true) == true && page == $page]
```

In GROQ v2, **any comparison against `null` returns `null`** — which is falsy. This means:

| `available` value in Sanity | `available != false` | `coalesce(available, true) == true` |
|---|---|---|
| `true` | ✅ passes | ✅ passes |
| `false` | ✅ excluded | ✅ excluded |
| not set / `null` | ❌ **silently dropped** | ✅ passes (defaults to true) |

Products where the `available` field was never explicitly set were being silently excluded from every category page. The homepage query already used the safe `coalesce()` form — it was only the category and fallback queries that had the bug.

---

## The correct GROQ query

```groq
*[_type == "product" && coalesce(available, true) == true && page == $page]
| order(_createdAt desc) {
  _id,
  "slug":     slug.current,
  "title_ka": name_ka,
  "title_en": name_en,
  "image":    coalesce(gallery[0].asset->url, image.asset->url),
  "gallery":  gallery[].asset->url,
  price,
  "oldPrice": old_price,
  badge,
  discount_pct,
  filterTags,
  style,
  description_ka,
  description_en,
  materials_ka,
  materials_en
}
```

Key decisions:
- `coalesce(available, true)` — treats a missing field the same as `true`
- `"title_ka": name_ka` — renames to match the `t(product, 'title')` helper in the renderer
- `"image": coalesce(gallery[0].asset->url, image.asset->url)` — uses the gallery first image; falls back to the single `image` field; if both are null, `processProducts()` substitutes `images/placeholder.svg`
- `gallery[].asset->url` — resolves all gallery asset URLs in one projection, avoiding N extra round-trips

---

## How the full fetch + render pipeline works (plain JS)

The three layers in [js/cms-loader.js](js/cms-loader.js):

```
HTML page (data-page="main-furniture")
    ↓
init()                      — picks grid element, calls loadProducts()
    ↓
loadProducts(pageSlug)      — builds GROQ, calls sanityQuery()
    ↓
sanityQuery(groq, params)   — fetch() to https://4n3g4zv5.apicdn.sanity.io
                              cache: 'default'  ← fixed
    ↓
processProducts(result)     — normalises fields, sets placeholder image
    ↓
renderProducts(items, grid, buildLoftCard | buildProductCard)
                            — creates <article> nodes, appends to DOM
```

For a standalone/new page you can drop this self-contained snippet:

```html
<div id="products"></div>
<script>
(function () {
  var PROJECT = '4n3g4zv5', DATASET = 'production', API = '2024-01-01';
  var LANG    = localStorage.getItem('loftline_lang') || 'ka';
  var PAGE    = 'main-furniture';   // change per page

  var QUERY = [
    '*[_type == "product"',
      '&& coalesce(available, true) == true',
      '&& page == $page',
    '] | order(_createdAt desc) {',
      '_id,',
      '"slug":     slug.current,',
      '"title_ka": name_ka,',
      '"title_en": name_en,',
      '"image":    coalesce(gallery[0].asset->url, image.asset->url),',
      'price',
    '}'
  ].join(' ');

  var url = 'https://' + PROJECT + '.apicdn.sanity.io/v' + API
    + '/data/query/' + DATASET
    + '?query=' + encodeURIComponent(QUERY)
    + '&$page=' + encodeURIComponent(JSON.stringify(PAGE));

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
```


## License: unknown
https://github.com/piroor/treestyletab/blob/c75c14fd5f29a33adb64ed62b299c881333409c7/webextensions/common/common.js

```
Both fixes from the previous session are still in [js/cms-loader.js](js/cms-loader.js). There's nothing left to change — the file is already correct. Here's the full explanation:

---

## What was wrong and how it was fixed

### Fix 1 — Stale HTTP cache (line 73)

```js
// BEFORE — broken
fetch(url, {cache: 'force-cache'})

// AFTER — fixed
fetch(url, {cache: 'default'})
```

`force-cache` tells the browser to serve a cached response forever, bypassing the server entirely. If Sanity was ever queried before any products existed, the browser cached that empty result and kept serving it on every subsequent visit. Changing to `'default'` lets the browser revalidate the response normally.

---

### Fix 2 — GROQ null comparison bug (lines 154 & 169)

```js
// BEFORE — broken (category pages)
*[_type == "product" && available != false && page == $page]

// AFTER — fixed (all three product queries now consistent)
*[_type == "product" && coalesce(available, true) == true && page == $page]
```

In GROQ v2, **any comparison against `null` returns `null`** — which is falsy. This means:

| `available` value in Sanity | `available != false` | `coalesce(available, true) == true` |
|---|---|---|
| `true` | ✅ passes | ✅ passes |
| `false` | ✅ excluded | ✅ excluded |
| not set / `null` | ❌ **silently dropped** | ✅ passes (defaults to true) |

Products where the `available` field was never explicitly set were being silently excluded from every category page. The homepage query already used the safe `coalesce()` form — it was only the category and fallback queries that had the bug.

---

## The correct GROQ query

```groq
*[_type == "product" && coalesce(available, true) == true && page == $page]
| order(_createdAt desc) {
  _id,
  "slug":     slug.current,
  "title_ka": name_ka,
  "title_en": name_en,
  "image":    coalesce(gallery[0].asset->url, image.asset->url),
  "gallery":  gallery[].asset->url,
  price,
  "oldPrice": old_price,
  badge,
  discount_pct,
  filterTags,
  style,
  description_ka,
  description_en,
  materials_ka,
  materials_en
}
```

Key decisions:
- `coalesce(available, true)` — treats a missing field the same as `true`
- `"title_ka": name_ka` — renames to match the `t(product, 'title')` helper in the renderer
- `"image": coalesce(gallery[0].asset->url, image.asset->url)` — uses the gallery first image; falls back to the single `image` field; if both are null, `processProducts()` substitutes `images/placeholder.svg`
- `gallery[].asset->url` — resolves all gallery asset URLs in one projection, avoiding N extra round-trips

---

## How the full fetch + render pipeline works (plain JS)

The three layers in [js/cms-loader.js](js/cms-loader.js):

```
HTML page (data-page="main-furniture")
    ↓
init()                      — picks grid element, calls loadProducts()
    ↓
loadProducts(pageSlug)      — builds GROQ, calls sanityQuery()
    ↓
sanityQuery(groq, params)   — fetch() to https://4n3g4zv5.apicdn.sanity.io
                              cache: 'default'  ← fixed
    ↓
processProducts(result)     — normalises fields, sets placeholder image
    ↓
renderProducts(items, grid, buildLoftCard | buildProductCard)
                            — creates <article> nodes, appends to DOM
```

For a standalone/new page you can drop this self-contained snippet:

```html
<div id="products"></div>
<script>
(function () {
  var PROJECT = '4n3g4zv5', DATASET = 'production', API = '2024-01-01';
  var LANG    = localStorage.getItem('loftline_lang') || 'ka';
  var PAGE    = 'main-furniture';   // change per page

  var QUERY = [
    '*[_type == "product"',
      '&& coalesce(available, true) == true',
      '&& page == $page',
    '] | order(_createdAt desc) {',
      '_id,',
      '"slug":     slug.current,',
      '"title_ka": name_ka,',
      '"title_en": name_en,',
      '"image":    coalesce(gallery[0].asset->url, image.asset->url),',
      'price',
    '}'
  ].join(' ');

  var url = 'https://' + PROJECT + '.apicdn.sanity.io/v' + API
    + '/data/query/' + DATASET
    + '?query=' + encodeURIComponent(QUERY)
    + '&$page=' + encodeURIComponent(JSON.stringify(PAGE));

  function esc(s) {
    return String(s || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
```

