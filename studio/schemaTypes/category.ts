import {defineField, defineType} from 'sanity'

const PAGE_OPTIONS = [
  {title: 'Main Furniture / მთავარი ავეჯი',    value: 'main-furniture'},
  {title: 'Office Furniture / საოფისე ავეჯი',  value: 'office-furniture'},
  {title: 'Loft Collection / ლოფტ კოლექცია',  value: 'loft-collection'},
  {title: 'Lighting / განათება',                value: 'lighting'},
  {title: 'Decoration / დეკორაცია',             value: 'decoration'},
]

export default defineType({
  name: 'category',
  title: 'Category / კატეგორია',
  type: 'document',

  fields: [
    // ── Names & Slug ─────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Title (EN)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title_ka',
      title: 'სათაური (KA)',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 80},
      validation: (Rule) => Rule.required(),
    }),

    // ── Classification ────────────────────────────────────────────
    defineField({
      name: 'pageKey',
      title: 'Parent Page / გვერდი',
      type: 'string',
      description: 'Which catalog page this category belongs to',
      options: {list: PAGE_OPTIONS, layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'filterKey',
      title: 'Filter Key',
      type: 'string',
      description: 'HTML data-filter value used in the site (e.g. mf-magida, lt-sakidi, dc-kedeli)',
    }),
    defineField({
      name: 'parent',
      title: 'Parent Category (optional)',
      type: 'reference',
      to: [{type: 'category'}],
      description: 'Leave blank for top-level categories',
    }),

    // ── Presentation ──────────────────────────────────────────────
    defineField({
      name: 'icon',
      title: 'Icon / ემოჯი',
      type: 'string',
      description: 'Emoji shown in the UI (e.g. 🛋️ 💡 🖼️)',
    }),
    defineField({
      name: 'description',
      title: 'Description (EN)',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'description_ka',
      title: 'Description (KA) / აღწერა',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'image',
      title: 'Category Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort Order',
      type: 'number',
      description: 'Lower number = displayed first',
      initialValue: 100,
    }),
  ],

  preview: {
    select: {title: 'title_ka', subtitle: 'filterKey', icon: 'icon'},
    prepare({title, subtitle, icon}: {title?: string; subtitle?: string; icon?: string}) {
      return {
        title:    `${icon ?? ''} ${title ?? 'Untitled'}`.trim(),
        subtitle: subtitle ? `filter: ${subtitle}` : '',
      }
    },
  },
})
