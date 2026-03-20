import {defineField, defineType} from 'sanity'

/**
 * Reusable hero section object type.
 * Embed with:  defineField({ name: 'hero', type: 'heroSection', ... })
 */
export default defineType({
  name: 'heroSection',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({
      name: 'label_ka',
      title: 'Label Tag (KA)',
      type: 'string',
      description: 'Small tag above the title. e.g. ხელნაკეთი ლოფტ ავეჯი',
    }),
    defineField({name: 'label_en', title: 'Label Tag (EN)', type: 'string'}),
    defineField({
      name: 'heading_ka',
      title: 'Heading (KA)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'heading_en', title: 'Heading (EN)', type: 'string'}),
    defineField({name: 'sub_ka', title: 'Subheading (KA)', type: 'text', rows: 2}),
    defineField({name: 'sub_en', title: 'Subheading (EN)', type: 'text', rows: 2}),
    defineField({
      name: 'bgImage',
      title: 'Background Image',
      type: 'image',
      description: 'Recommended: 1600×700 px, WebP format',
      options: {hotspot: true},
    }),
    defineField({name: 'btnPrimary_ka',    title: 'Primary Button Label (KA)',   type: 'string'}),
    defineField({name: 'btnPrimary_en',    title: 'Primary Button Label (EN)',   type: 'string'}),
    defineField({name: 'btnPrimary_url',   title: 'Primary Button URL',          type: 'string'}),
    defineField({name: 'btnSecondary_ka',  title: 'Secondary Button Label (KA)', type: 'string'}),
    defineField({name: 'btnSecondary_en',  title: 'Secondary Button Label (EN)', type: 'string'}),
    defineField({name: 'btnSecondary_url', title: 'Secondary Button URL',        type: 'string'}),
  ],
})
