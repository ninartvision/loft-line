import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'homepage',
  title: 'Homepage / მთავარი გვერდი',
  type: 'document',

  fields: [
    // ── SEO ──────────────────────────────────────────────────────
    defineField({
      name: 'seo',
      title: '🔍 SEO',
      type: 'seo',
      options: {collapsible: true, collapsed: true},
    }),

    // ── Hero Section ─────────────────────────────────────────────
    defineField({
      name: 'heroSection',
      title: '① Hero Section',
      type: 'heroSection',
      options: {collapsible: true, collapsed: false},
    }),

    // ── Announcement Bar ─────────────────────────────────────────
    defineField({
      name: 'announcementSection',
      title: '② Announcement Bar',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'visible',  title: 'Show Bar',    type: 'boolean', initialValue: true}),
        defineField({name: 'text1_ka', title: 'Text 1 (KA)', type: 'string'}),
        defineField({name: 'text1_en', title: 'Text 1 (EN)', type: 'string'}),
        defineField({name: 'text2_ka', title: 'Text 2 (KA)', type: 'string'}),
        defineField({name: 'text2_en', title: 'Text 2 (EN)', type: 'string'}),
        defineField({name: 'text3_ka', title: 'Text 3 (KA)', type: 'string'}),
        defineField({name: 'text3_en', title: 'Text 3 (EN)', type: 'string'}),
      ],
    }),

    // ── USP Strip ────────────────────────────────────────────────
    defineField({
      name: 'uspSection',
      title: '③ USP Strip (Why Choose Us)',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({
          name: 'items',
          title: 'USP Items',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {name: 'icon',     title: 'Icon (emoji)',     type: 'string'},
                {name: 'label_ka', title: 'Label (KA)',       type: 'string'},
                {name: 'label_en', title: 'Label (EN)',       type: 'string'},
                {name: 'desc_ka',  title: 'Description (KA)', type: 'string'},
                {name: 'desc_en',  title: 'Description (EN)', type: 'string'},
              ],
              preview: {
                select: {title: 'label_ka', subtitle: 'icon'},
                prepare: ({title, subtitle}: {title?: string; subtitle?: string}) => ({
                  title: `${subtitle ?? ''} ${title ?? ''}`.trim(),
                }),
              },
            },
          ],
        }),
      ],
    }),

    // ── Categories Section ────────────────────────────────────────
    defineField({
      name: 'categoriesSection',
      title: '④ Categories Grid',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'heading_ka', title: 'Heading (KA)', type: 'string'}),
        defineField({name: 'heading_en', title: 'Heading (EN)', type: 'string'}),
        defineField({
          name: 'categories',
          title: 'Categories to Show',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'category'}]}],
        }),
      ],
    }),

    // ── Featured Products ─────────────────────────────────────────
    defineField({
      name: 'featuredSection',
      title: '⑤ Featured Products',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'heading_ka',  title: 'Section Heading (KA)', type: 'string'}),
        defineField({name: 'heading_en',  title: 'Section Heading (EN)', type: 'string'}),
        defineField({name: 'sub_ka',      title: 'Subheading (KA)',      type: 'string'}),
        defineField({name: 'sub_en',      title: 'Subheading (EN)',      type: 'string'}),
        defineField({
          name: 'products',
          title: 'Featured Products (max 6)',
          type: 'array',
          of: [{type: 'reference', to: [{type: 'product'}], weak: true}],
          validation: (Rule) => Rule.max(6),
        }),
        defineField({name: 'btnLabel_ka', title: 'Button Label (KA)', type: 'string'}),
        defineField({name: 'btnLabel_en', title: 'Button Label (EN)', type: 'string'}),
        defineField({name: 'btnUrl',      title: 'Button URL',        type: 'string'}),
      ],
    }),

    // ── About / Story ─────────────────────────────────────────────
    defineField({
      name: 'aboutSection',
      title: '⑥ About / Story Section',
      type: 'ctaSection',
      options: {collapsible: true, collapsed: true},
    }),

    // ── Newsletter ────────────────────────────────────────────────
    defineField({
      name: 'newsletterSection',
      title: '⑦ Newsletter Section',
      type: 'object',
      options: {collapsible: true, collapsed: true},
      fields: [
        defineField({name: 'visible',        title: 'Show section',          type: 'boolean', initialValue: true}),
        defineField({name: 'heading_ka',     title: 'Heading (KA)',          type: 'string'}),
        defineField({name: 'heading_en',     title: 'Heading (EN)',          type: 'string'}),
        defineField({name: 'desc_ka',        title: 'Description (KA)',      type: 'text', rows: 2}),
        defineField({name: 'desc_en',        title: 'Description (EN)',      type: 'text', rows: 2}),
        defineField({name: 'placeholder_ka', title: 'Input Placeholder (KA)', type: 'string'}),
        defineField({name: 'placeholder_en', title: 'Input Placeholder (EN)', type: 'string'}),
        defineField({name: 'btnLabel_ka',    title: 'Button Label (KA)',     type: 'string'}),
        defineField({name: 'btnLabel_en',    title: 'Button Label (EN)',     type: 'string'}),
      ],
    }),
  ],

  preview: {
    select: {title: 'heroSection.heading_ka'},
    prepare({title}: {title?: string}) {
      return {title: title || 'Homepage', subtitle: 'Singleton document'}
    },
  },
})
