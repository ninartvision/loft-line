// ── Document types ───────────────────────────────────────────
import productType       from './product'
import categoryType      from './category'
import collectionType    from './collection'
import homepageType      from './homepage'
import pageContentType   from './pageContent'
import galleryType       from './gallery'
import seoSettingsType   from './seoSettings'
import globalSettingsType from './globalSettings'

// ── Reusable object / array types ────────────────────────────
import seoType           from './seo'
import heroSectionType   from './heroSection'
import richTextBlockType from './richTextBlock'
import ctaSectionType    from './ctaSection'

export const schemaTypes = [
  // Documents
  productType,
  categoryType,
  collectionType,
  homepageType,
  pageContentType,
  galleryType,
  seoSettingsType,
  globalSettingsType,
  // Reusable objects & arrays
  seoType,
  heroSectionType,
  richTextBlockType,
  ctaSectionType,
]
