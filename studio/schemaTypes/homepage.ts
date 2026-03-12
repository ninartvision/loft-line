import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'homepage',
  title: 'Homepage / მთავარი გვერდი',
  type: 'document',

  fields: [
    // ── Hero Section ────────────────────────────────────────────
    defineField({
      name: 'heroSection',
      title: '① Hero Section',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({name: 'tag_ka',   title: 'Tag (KA)',         type: 'string'}),
        defineField({name: 'tag_en',   title: 'Tag (EN)',         type: 'string'}),
        defineField({name: 'title_ka', title: 'Hero Title (KA)',  type: 'string'}),
        defineField({name: 'title_en', title: 'Hero Title (EN)',  type: 'string'}),
        defineField({name: 'desc_ka',  title: 'Description (KA)', type: 'string'}),
        defineField({name: 'desc_en',  title: 'Description (EN)', type: 'string'}),
        defineField({name: 'btn1_ka',  title: 'Button 1 (KA)',   type: 'string'}),
        defineField({name: 'btn1_en',  title: 'Button 1 (EN)',   type: 'string'}),
        defineField({name: 'btn2_ka',  title: 'Button 2 (KA)',   type: 'string'}),
        defineField({name: 'btn2_en',  title: 'Button 2 (EN)',   type: 'string'}),
        defineField({
          name: 'bg_image',
          title: 'Background Image',
          type: 'image',
          options: {hotspot: true},
        }),
      ],
    }),

    // ── Announcement Bar ─────────────────────────────────────────
    defineField({
      name: 'announcementSection',
      title: '② Announcement Bar',
      type: 'object',
      options: {collapsible: true, collapsed: false},
      fields: [
        defineField({name: 'visible',   title: 'Show bar',                   type: 'boolean', initialValue: true}),
        defineField({name: 'text1_ka',  title: 'Text 1 (KA)',                type: 'string'}),
        defineField({name: 'text1_en',  title: 'Text 1 (EN)',                type: 'string'}),
        defineField({name: 'text2_ka',  title: 'Text 2 (KA)',                type: 'string'}),
        defineField({name: 'text2_en',  title: 'Text 2 (EN)',                type: 'string'}),
      ],
    }),
  ],

  preview: {
    select: {title: 'heroSection.title_ka'},
    prepare({title}) {
      return {title: title || 'Homepage', subtitle: 'Singleton document'}
    },
  },
})
