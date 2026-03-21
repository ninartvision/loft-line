import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'seoSettings',
  title: 'SEO Settings',
  type: 'document',

  // Singleton — only one document (ID: seo-settings-singleton)
  // Managed via structureTool in sanity.config.ts

  fields: [
    defineField({
      name: 'defaultMetaTitle',
      title: 'Default Meta Title',
      type: 'string',
      description: 'Fallback title used when a page has no specific title',
    }),
    defineField({
      name: 'defaultMetaDescription',
      title: 'Default Meta Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'ogImage',
      title: 'Default OG Image',
      type: 'image',
      description: 'Image used when sharing the site on social media (1200×630 px recommended)',
      options: {hotspot: true},
    }),
    defineField({
      name: 'twitterHandle',
      title: 'Twitter / X Handle',
      type: 'string',
      description: 'e.g. @loftlinestore',
    }),
    defineField({
      name: 'googleVerification',
      title: 'Google Search Console Verification',
      type: 'string',
    }),
  ],

  preview: {
    prepare() {
      return {title: 'SEO Settings', subtitle: 'Global SEO defaults'}
    },
  },
})
