import {defineField, defineType} from 'sanity'

/**
 * Reusable call-to-action section object type.
 * Embed with:  defineField({ name: 'cta', type: 'ctaSection', ... })
 */
export default defineType({
  name: 'ctaSection',
  title: 'CTA Section',
  type: 'object',
  fields: [
    defineField({name: 'visible',     title: 'Show this section',  type: 'boolean', initialValue: true}),
    defineField({name: 'heading_ka',  title: 'Heading (KA)',       type: 'string'}),
    defineField({name: 'heading_en',  title: 'Heading (EN)',       type: 'string'}),
    defineField({name: 'body_ka',     title: 'Body Text (KA)',     type: 'text', rows: 3}),
    defineField({name: 'body_en',     title: 'Body Text (EN)',     type: 'text', rows: 3}),
    defineField({name: 'btnLabel_ka', title: 'Button Label (KA)',  type: 'string'}),
    defineField({name: 'btnLabel_en', title: 'Button Label (EN)',  type: 'string'}),
    defineField({name: 'btnUrl',      title: 'Button URL',         type: 'string'}),
    defineField({
      name: 'bgImage',
      title: 'Background Image',
      type: 'image',
      options: {hotspot: true},
    }),
  ],
})
