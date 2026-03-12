import {defineField, defineType} from 'sanity'

const PAGE_OPTIONS = [
  {title: 'Main Furniture / მთავარი ავეჯი',     value: 'main-furniture'},
  {title: 'Office Furniture / საოფისე ავეჯი',   value: 'office-furniture'},
  {title: 'Loft Collection / ლოფტ კოლექცია',   value: 'loft-collection'},
  {title: 'Lighting / განათება',                 value: 'lighting'},
  {title: 'Decoration / დეკორაცია',              value: 'decoration'},
]

export default defineType({
  name: 'pageContent',
  title: 'Category Page Content / კატეგორიის გვერდი',
  type: 'document',

  fields: [
    defineField({
      name: 'pageKey',
      title: 'Page',
      type: 'string',
      options: {list: PAGE_OPTIONS, layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'hero_title_ka',
      title: 'Hero Title (KA)',
      type: 'string',
    }),
    defineField({
      name: 'hero_title_en',
      title: 'Hero Title (EN)',
      type: 'string',
    }),
    defineField({
      name: 'hero_sub_ka',
      title: 'Hero Subtitle (KA)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'hero_sub_en',
      title: 'Hero Subtitle (EN)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'hero_image',
      title: 'Hero Background Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'seo_title',
      title: 'SEO Meta Title',
      type: 'string',
    }),
    defineField({
      name: 'seo_desc',
      title: 'SEO Meta Description',
      type: 'text',
      rows: 2,
    }),
  ],

  preview: {
    select: {title: 'pageKey', subtitle: 'hero_title_ka'},
    prepare({title, subtitle}) {
      const label = PAGE_OPTIONS.find((p) => p.value === title)?.title ?? title
      return {title: label || 'Untitled', subtitle}
    },
  },
})
