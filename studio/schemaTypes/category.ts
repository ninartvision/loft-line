import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category / კატეგორია',
  type: 'document',
  fields: [
    // ── Names (bilingual) ────────────────────────────────────────
    defineField({
      name: 'title_ka',
      title: 'სახელი (KA)',
      type: 'string',
      validation: (rule) => rule.required().min(2).max(80),
    }),
    defineField({
      name: 'title',
      title: 'Title (EN)',
      type: 'string',
      description: 'English display name. Also used as the category reference title in CMS.',
      validation: (rule) => rule.max(80),
    }),

    // ── Slug ────────────────────────────────────────────────────
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title_ka', maxLength: 96},
      validation: (rule) => rule.required(),
    }),

    // ── Image ────────────────────────────────────────────────────
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),

    // ── CMS routing keys ─────────────────────────────────────────
    defineField({
      name: 'filterKey',
      title: 'Filter Key',
      type: 'string',
      description: 'Lowercase slug used by the front-end filter system (e.g. "wood", "metal").',
      validation: (rule) =>
        rule.regex(/^[a-z0-9-]+$/, {name: 'lowercase-slug', invert: false})
             .warning('Use only lowercase letters, numbers, and hyphens.'),
    }),
    defineField({
      name: 'pageKey',
      title: 'Page Key',
      type: 'string',
      description: 'Matches the data-page value of the HTML page that lists this category.',
      options: {
        list: [
          {title: 'Homepage',         value: 'index'},
          {title: 'Main Furniture',   value: 'main-furniture'},
          {title: 'Office Furniture', value: 'office-furniture'},
          {title: 'Loft Collection',  value: 'loft-collection'},
          {title: 'Lighting',         value: 'lighting'},
          {title: 'Decoration',       value: 'decoration'},
        ],
        layout: 'radio',
      },
    }),
  ],

  preview: {
    select: {
      title_ka: 'title_ka',
      title:    'title',
      media:    'image',
      slug:     'slug.current',
    },
    prepare({title_ka, title, media, slug}) {
      return {
        title:    title_ka || title || 'Untitled category',
        subtitle: slug ? `/${slug}` : 'No slug',
        media,
      }
    },
  },
})
