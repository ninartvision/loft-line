import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product / პროდუქტი',
  type: 'document',
  fields: [
    // ── Names (bilingual) ────────────────────────────────────────
    defineField({
      name: 'name_ka',
      title: 'სახელი (KA)',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(120),
    }),
    defineField({
      name: 'name_en',
      title: 'Name (EN)',
      type: 'string',
      validation: (rule) => rule.max(120),
    }),

    // ── Slug ────────────────────────────────────────────────────
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'name_ka', maxLength: 96},
      validation: (rule) => rule.required(),
    }),

    // ── Page assignment ──────────────────────────────────────────
    defineField({
      name: 'page',
      title: 'Page / გვერდი',
      type: 'string',
      description: 'Which category page this product appears on.',
      options: {
        list: [
          {title: 'Homepage',          value: 'index'},
          {title: 'Main Furniture',    value: 'main-furniture'},
          {title: 'Office Furniture',  value: 'office-furniture'},
          {title: 'Loft Collection',   value: 'loft-collection'},
          {title: 'Lighting',          value: 'lighting'},
          {title: 'Decoration',        value: 'decoration'},
        ],
        layout: 'radio',
      },
    }),

    // ── Category reference ───────────────────────────────────────
    defineField({
      name: 'category',
      title: 'Category / კატეგორია',
      type: 'reference',
      to: [{type: 'category'}],
    }),

    // ── Pricing ──────────────────────────────────────────────────
    defineField({
      name: 'price',
      title: 'Price ₾',
      type: 'number',
      validation: (rule) => rule.required().min(0),
    }),
    defineField({
      name: 'old_price',
      title: 'Old Price ₾ (strike-through)',
      type: 'number',
      validation: (rule) => rule.min(0),
    }),
    defineField({
      name: 'discount_pct',
      title: 'Discount %',
      type: 'number',
      description: 'Displayed as a badge (e.g. 20 → "−20%"). Auto-calculated if left empty.',
      validation: (rule) => rule.min(0).max(100),
    }),
    defineField({
      name: 'badge',
      title: 'Badge label',
      type: 'string',
      description: 'Short label shown on the card, e.g. "NEW", "SALE". Leave empty for none.',
      validation: (rule) => rule.max(20),
    }),

    // ── Images ───────────────────────────────────────────────────
    defineField({
      name: 'image',
      title: 'Main Image',
      type: 'image',
      options: {hotspot: true},
      description: 'Fallback if no gallery images are provided.',
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [defineArrayMember({type: 'image', options: {hotspot: true}})],
      description: 'First image is used as the product card thumbnail.',
      validation: (rule) => rule.max(12),
    }),

    // ── Descriptions (bilingual) ─────────────────────────────────
    defineField({
      name: 'description_ka',
      title: 'აღწერა (KA)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'description_en',
      title: 'Description (EN)',
      type: 'text',
      rows: 4,
    }),

    // ── Materials (bilingual array) ──────────────────────────────
    defineField({
      name: 'materials_ka',
      title: 'მასალები (KA)',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'materials_en',
      title: 'Materials (EN)',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),

    // ── Filter tags ──────────────────────────────────────────────
    defineField({
      name: 'filterTags',
      title: 'Filter Tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
      description: 'Used by the on-page filter (e.g. "wood", "metal", "fabric").',
      validation: (rule) => rule.unique().max(20),
    }),

    // ── Style ────────────────────────────────────────────────────
    defineField({
      name: 'style',
      title: 'Style',
      type: 'string',
      options: {
        list: ['loft', 'modern', 'classic', 'scandinavian', 'industrial'],
        layout: 'radio',
      },
      initialValue: 'loft',
    }),

    // ── Flags ────────────────────────────────────────────────────
    defineField({
      name: 'available',
      title: 'Available / ხელმისაწვდომია',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Featured / გამორჩეული',
      type: 'boolean',
      initialValue: false,
    }),
  ],

  preview: {
    select: {
      name_ka:  'name_ka',
      name_en:  'name_en',
      price:    'price',
      media:    'gallery.0',
      mediaBg:  'image',
    },
    prepare({name_ka, name_en, price, media, mediaBg}) {
      return {
        title:    name_ka || name_en || 'Untitled product',
        subtitle: typeof price === 'number' ? `₾${price}` : 'No price',
        media:    media || mediaBg,
      }
    },
  },

  orderings: [
    {
      title: 'Featured first',
      name: 'featuredDesc',
      by: [
        {field: 'featured', direction: 'desc'},
        {field: '_createdAt', direction: 'desc'},
      ],
    },
    {
      title: 'Price, low to high',
      name: 'priceAsc',
      by: [{field: 'price', direction: 'asc'}],
    },
    {
      title: 'Price, high to low',
      name: 'priceDesc',
      by: [{field: 'price', direction: 'desc'}],
    },
  ],
})
