import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title_ka',
      title: 'Title (KA)',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'title_en',
      title: 'Title (EN)',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title_en',
        maxLength: 96,
      },
    }),
    // ── Used by cms-loader.js filter buttons ─────────────────────
    defineField({
      name: 'filterKey',
      title: 'Filter Key',
      description: 'Short slug used for front-end filter buttons (e.g. outdoor, office, loft, lighting, decoration). Must be lowercase with no spaces.',
      type: 'string',
      validation: Rule => Rule.regex(/^[a-z0-9-]+$/).warning('Use only lowercase letters, numbers and hyphens.'),
    }),
    // ── Used by cms-loader.js page-based product lookup (fallback) ─
    defineField({
      name: 'pageKey',
      title: 'Page Key',
      description: 'Matches the data-page attribute on HTML pages (e.g. main-furniture, office-furniture, loft-collection, lighting, decoration).',
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
  ],

  preview: {
    select: {title: 'title_ka', subtitle: 'filterKey'},
  },
})
