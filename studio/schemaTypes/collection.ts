import {defineArrayMember, defineField, defineType} from 'sanity'

export default defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Examples: Popular, New Arrivals, Best Sellers.',
      validation: (rule) => rule.required().min(2).max(100),
    }),
    defineField({
      name: 'products',
      title: 'Products',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'product'}],
        }),
      ],
      validation: (rule) => rule.required().min(1).unique(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      products: 'products',
    },
    prepare({title, products}) {
      const productCount = Array.isArray(products) ? products.length : 0

      return {
        title: title || 'Untitled collection',
        subtitle: `${productCount} product${productCount === 1 ? '' : 's'}`,
      }
    },
  },
})