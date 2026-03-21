import {defineField, defineType} from 'sanity'

/**
 * Reusable SEO object type.
 * Embed with:  defineField({ name: 'seo', type: 'seo', ... })
 */
export default defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      description: 'Browser tab & Google results. Max 60 chars.',
      validation: (Rule) => Rule.max(60),
    }),
    defineField({
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      rows: 2,
      description: 'Google snippet. Max 160 chars.',
      validation: (Rule) => Rule.max(160),
    }),
    defineField({
      name: 'keywords',
      title: 'Keywords',
      type: 'string',
      description: 'Comma-separated. e.g. სასადილო მაგიდა, loft furniture tbilisi',
    }),
    defineField({
      name: 'ogTitle',
      title: 'OG Title (Social Share)',
      type: 'string',
      description: 'Shown when sharing on Facebook/WhatsApp. Falls back to Meta Title.',
    }),
    defineField({
      name: 'ogDescription',
      title: 'OG Description (Social Share)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ogImage',
      title: 'OG Image (Social Share)',
      type: 'image',
      description: 'Recommended: 1200×630 px',
      options: {hotspot: true},
    }),
    defineField({
      name: 'twitterTitle',
      title: 'Twitter / X Title',
      type: 'string',
    }),
    defineField({
      name: 'twitterDescription',
      title: 'Twitter / X Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from Search Engines (noindex)',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
