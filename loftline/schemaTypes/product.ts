import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
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
      name: 'price',
      title: 'Price',
      type: 'number',
    }),
    defineField({
      name: 'dimensions_ka',
      title: 'Dimensions (KA)',
      description: 'Product dimensions in Georgian.',
      type: 'string',
    }),
    defineField({
      name: 'dimensions_en',
      title: 'Dimensions (EN)',
      description: 'Product dimensions in English.',
      type: 'string',
    }),
    defineField({
      name: 'filterTags',
      title: 'Filter Tags',
      description: 'Tag values used for filtering products.',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'guarantee',
      title: 'Guarantee',
      description: 'Guarantee text shown for the product.',
      type: 'string',
    }),
    defineField({
      name: 'popularity',
      title: 'Popularity',
      description: 'Numeric popularity value for sorting or ranking.',
      type: 'number',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      description: 'Numeric manual sort order value.',
      type: 'number',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{type: 'category'}],
    }),
  ],
})