import {defineArrayMember, defineType} from 'sanity'

/**
 * Reusable portable-text array type.
 * Embed with:  defineField({ name: 'body_ka', type: 'richTextBlock' })
 */
export default defineType({
  name: 'richTextBlock',
  title: 'Rich Text Block',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Normal',    value: 'normal'},
        {title: 'Heading 2', value: 'h2'},
        {title: 'Heading 3', value: 'h3'},
        {title: 'Heading 4', value: 'h4'},
        {title: 'Quote',     value: 'blockquote'},
      ],
      marks: {
        decorators: [
          {title: 'Bold',      value: 'strong'},
          {title: 'Italic',    value: 'em'},
          {title: 'Underline', value: 'underline'},
        ],
        annotations: [
          {
            name: 'link',
            type: 'object',
            title: 'Link',
            fields: [
              {name: 'href',   title: 'URL',              type: 'url'},
              {name: 'newTab', title: 'Open in new tab',   type: 'boolean', initialValue: false},
            ],
          },
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: {hotspot: true},
      fields: [
        {name: 'alt',     title: 'Alt Text (accessibility & SEO)', type: 'string'},
        {name: 'caption', title: 'Caption',                        type: 'string'},
      ],
    }),
  ],
})
