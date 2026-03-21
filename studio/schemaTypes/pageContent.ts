import {defineField, defineType} from 'sanity'

export const PAGE_OPTIONS = [
  {title: 'Main Furniture / მთავარი ავეჯი',    value: 'main-furniture'},
  {title: 'Office Furniture / საოფისე ავეჯი',  value: 'office-furniture'},
  {title: 'Loft Collection / ლოფტ კოლექცია',  value: 'loft-collection'},
  {title: 'Lighting / განათება',                value: 'lighting'},
  {title: 'Decoration / დეკორაცია',             value: 'decoration'},
]

export default defineType({
  name: 'pageContent',
  title: 'Category Page / კატეგორიის გვერდი',
  type: 'document',

  // One document per catalog page. Use pageKey as the identifier.

  fields: [
    // ── Page Identity ─────────────────────────────────────────────
    defineField({
      name: 'pageKey',
      title: 'Page',
      type: 'string',
      options: {list: PAGE_OPTIONS, layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),

    // ── SEO ───────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: '🔍 SEO',
      type: 'seo',
      options: {collapsible: true, collapsed: false},
    }),

    // ── Hero Section ──────────────────────────────────────────────
    defineField({
      name: 'hero',
      title: '① Hero Section',
      type: 'heroSection',
      options: {collapsible: true, collapsed: false},
    }),

    // ── Catalog Bar ───────────────────────────────────────────────
    defineField({
      name: 'catalogBar',
      title: '② Catalog Bar',
      type: 'object',
      description: 'Text displayed in the bar above the product grid',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'countSuffix_ka',
          title: 'Count Suffix (KA)',
          type: 'string',
          initialValue: 'პროდუქტი',
          description: 'Shown after product count: "8 პროდუქტი"',
        }),
        defineField({
          name: 'countSuffix_en',
          title: 'Count Suffix (EN)',
          type: 'string',
          initialValue: 'Products',
        }),
      ],
    }),

    // ── Pinned Products ───────────────────────────────────────────
    defineField({
      name: 'featuredProducts',
      title: '③ Pinned / Featured Products',
      type: 'array',
      description: 'These products are always shown first in the grid (max 3)',
      of: [{type: 'reference', to: [{type: 'product'}]}],
      validation: (Rule) => Rule.max(3),
    }),

    // ── CTA Section ───────────────────────────────────────────────
    defineField({
      name: 'cta',
      title: '④ CTA Section',
      type: 'ctaSection',
      options: {collapsible: true, collapsed: true},
    }),

    // ── Editorial Body ────────────────────────────────────────────
    defineField({
      name: 'body_ka',
      title: '⑤ Page Body — Rich Text (KA)',
      type: 'richTextBlock',
      description: 'Optional editorial content shown below the product grid',
    }),
    defineField({
      name: 'body_en',
      title: '⑤ Page Body — Rich Text (EN)',
      type: 'richTextBlock',
    }),
  ],

  preview: {
    select: {key: 'pageKey', heading: 'hero.heading_ka'},
    prepare({key, heading}: {key?: string; heading?: string}) {
      const label = PAGE_OPTIONS.find((p) => p.value === key)?.title ?? key
      return {title: label || 'Untitled', subtitle: heading ?? ''}
    },
  },
})
