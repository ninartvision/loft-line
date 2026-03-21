import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    // ── Names (live CMS uses name_ka / name_en) ──────────────────
    defineField({
      name: 'name_ka',
      title: 'Name (KA)',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'name_en',
      title: 'Name (EN)',
      type: 'string',
    }),

    // ── Slug ─────────────────────────────────────────────────────
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name_en', maxLength: 96},
      validation: Rule => Rule.required(),
    }),

    // ── Category reference ────────────────────────────────────────
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),

    // ── Page assignment (matches data-page attribute on HTML pages) ─
    defineField({
      name: 'page',
      title: 'Page',
      description: 'Which category page shows this product. Must match data-page value (e.g. main-furniture, office-furniture, loft-collection, lighting, decoration).',
      type: 'string',
      options: {
        list: [
          {title: 'Outdoor / Main Furniture', value: 'main-furniture'},
          {title: 'Office Furniture',         value: 'office-furniture'},
          {title: 'Loft Collection',          value: 'loft-collection'},
          {title: 'Lighting',                 value: 'lighting'},
          {title: 'Decoration',               value: 'decoration'},
        ],
      },
    }),

    // ── Pricing ───────────────────────────────────────────────────
    defineField({
      name: 'price',
      title: 'Price (₾)',
      type: 'number',
      validation: Rule => Rule.required().min(0),
    }),
    defineField({
      name: 'old_price',
      title: 'Old Price (₾)',
      description: 'Original price before sale. Leave empty if not on sale.',
      type: 'number',
    }),

    // ── Badge & discount ─────────────────────────────────────────
    defineField({
      name: 'badge',
      title: 'Badge',
      type: 'string',
      options: {list: [{title: 'Sale', value: 'sale'}, {title: 'New', value: 'new'}, {title: 'Best Seller', value: 'best'}]},
    }),
    defineField({
      name: 'discount_pct',
      title: 'Discount %',
      type: 'number',
    }),

    // ── Images ───────────────────────────────────────────────────
    defineField({
      name: 'image',
      title: 'Main Image (legacy fallback)',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      description: 'Upload multiple product images for the gallery slider in the quick-view modal.',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),

    // ── Descriptions ─────────────────────────────────────────────
    defineField({
      name: 'description_ka',
      title: 'Description (KA)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'description_en',
      title: 'Description (EN)',
      type: 'text',
      rows: 4,
    }),

    // ── Materials ────────────────────────────────────────────────
    defineField({
      name: 'materials_ka',
      title: 'Materials (KA)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'materials_en',
      title: 'Materials (EN)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),

    // ── Filter tags ──────────────────────────────────────────────
    defineField({
      name: 'filterTags',
      title: 'Filter Tags',
      description: 'Values used for the front-end filter buttons (e.g. outdoor, metal, wood).',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),

    // ── Style ────────────────────────────────────────────────────
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {list: [{title: 'Loft', value: 'loft'}, {title: 'Modern', value: 'modern'}, {title: 'Rustic', value: 'rustic'}, {title: 'Scandinavian', value: 'scandinavian'}]},
    }),

    // ── Availability & visibility ────────────────────────────────
    defineField({
      name: 'available',
      title: 'Available',
      description: 'Uncheck to hide this product from all pages.',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      description: 'Show on homepage featured section.',
      type: 'boolean',
      initialValue: false,
    }),

    // ── Guarantee ────────────────────────────────────────────────
    defineField({
      name: 'guarantee',
      title: 'Guarantee',
      type: 'string',
    }),

    // ── Sorting ──────────────────────────────────────────────────
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      description: 'Lower numbers appear first.',
      type: 'number',
    }),
  ],

  preview: {
    select: {title: 'name_ka', media: 'gallery.0', subtitle: 'price'},
    prepare({title, media, subtitle}) {
      return {title, media, subtitle: subtitle ? `₾${subtitle}` : ''}
    },
  },
})
