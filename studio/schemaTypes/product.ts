import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product / პროდუქტი',
  type: 'document',

  fields: [
    defineField({
      name: 'name_ka',
      title: 'პროდუქტის სახელი (KA)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'name_en',
      title: 'Product Name (EN)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug (URL ID)',
      type: 'slug',
      options: {source: 'name_en', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category / კატეგორია',
      type: 'reference',
      to: [{type: 'category'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'filterTags',
      title: 'Filter Tags / ფილტრის თეგები',
      type: 'array',
      of: [{type: 'string'}],
      description: 'HTML data-filter values for in-page filtering. e.g. mf-magida, lt-sakidi',
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'style',
      title: 'Style / სტილი',
      type: 'string',
      options: {
        list: [
          {title: 'ლოფტი', value: 'loft'},
          {title: 'ინდუსტრიული', value: 'industrial'},
          {title: 'თანამედროვე', value: 'modern'},
        ],
      },
    }),
    defineField({
      name: 'price',
      title: 'Price ₾ / ფასი',
      type: 'number',
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: 'old_price',
      title: 'Old Price ₾ (0 = none) / ძველი ფასი',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'badge',
      title: 'Badge / ბეჯი',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: ''},
          {title: 'ახალი / New', value: 'new'},
          {title: 'ფასდაკლება / Sale', value: 'sale'},
          {title: 'Best Seller', value: 'best'},
        ],
      },
    }),
    defineField({
      name: 'discount_pct',
      title: 'Discount % / ფასდაკლება %',
      type: 'number',
      hidden: ({document}) => document?.badge !== 'sale',
    }),
    defineField({
      name: 'description_ka',
      title: 'Description (KA) / აღწერა',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'description_en',
      title: 'Description (EN)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'materials_ka',
      title: 'Materials (KA) / მასალები',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'materials_en',
      title: 'Materials (EN)',
      type: 'array',
      of: [{type: 'string'}],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'dimensions_ka',
      title: 'Dimensions (KA) / ზომები',
      type: 'string',
      description: 'e.g. 120\u00d760\u00d775 სმ',
    }),
    defineField({
      name: 'dimensions_en',
      title: 'Dimensions (EN)',
      type: 'string',
      description: 'e.g. 120\u00d760\u00d775 cm',
    }),
    defineField({
      name: 'guarantee',
      title: 'Guarantee / გარანტია',
      type: 'string',
      options: {
        list: [
          {title: '2 წლის გარანტია', value: '2 წლის გარანტია'},
          {title: '5 წლის გარანტია', value: '5 წლის გარანტია'},
          {title: '1 წლის გარანტია', value: '1 წლის გარანტია'},
          {title: 'გარანტიის გარეშე', value: ''},
        ],
        layout: 'radio',
      },
      initialValue: '2 წლის გარანტია',
    }),
    defineField({
      name: 'image',
      title: 'Main Image / მთავარი სურათი',
      type: 'image',
      options: {hotspot: true},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery Images / გალერეა',
      type: 'array',
      of: [{type: 'image', options: {hotspot: true}}],
    }),
    defineField({
      name: 'available',
      title: 'Available / ხელმისაწვდომია',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'featured',
      title: 'Featured on Homepage / მთავარ გვერდზე',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'popularity',
      title: 'Popularity Score (0–100)',
      type: 'number',
      description: 'Used for "sort by popularity". Higher = shown first.',
      initialValue: 50,
      validation: (Rule) => Rule.min(0).max(100),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Manual Sort Order',
      type: 'number',
      description: 'Lower number = shown first in manual sort.',
      initialValue: 100,
    }),
    defineField({
      name: 'page',
      title: 'Page / გვერდი',
      type: 'string',
      options: {
        list: [
          {title: 'Homepage / მთავარი', value: 'index'},
          {title: 'Main Furniture / მთავარი ავეჯი', value: 'main-furniture'},
          {title: 'Office Furniture / საოფისე ავეჯი', value: 'office-furniture'},
          {title: 'Loft Collection / ლოფტ კოლექცია', value: 'loft-collection'},
          {title: 'Lighting / განათება', value: 'lighting'},
          {title: 'Decoration / დეკორაცია', value: 'decoration'},
        ],
      },
    }),
  ],

  preview: {
    select: {
      title: 'name_ka',
      subtitle: 'price',
      media: 'image',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title || 'Untitled',
        subtitle: subtitle ? `₾${subtitle}` : 'No price',
        media,
      }
    },
  },
})
