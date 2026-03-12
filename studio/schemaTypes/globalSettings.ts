import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'globalSettings',
  title: 'Global Settings / გლობალური პარამეტრები',
  type: 'document',

  // Singleton — only one document (ID: global-settings-singleton)
  // Managed via structureTool in sanity.config.ts

  fields: [
    defineField({name: 'site_name',  title: 'Site Name',  type: 'string'}),
    defineField({name: 'site_url',   title: 'Site URL',   type: 'url'}),
    defineField({name: 'phone',      title: 'Phone',      type: 'string'}),
    defineField({name: 'email',      title: 'Email',      type: 'string'}),
    defineField({name: 'facebook',   title: 'Facebook URL', type: 'url'}),
    defineField({name: 'instagram',  title: 'Instagram URL', type: 'url'}),
    defineField({
      name: 'free_delivery_threshold',
      title: 'Free Delivery Threshold ₾',
      type: 'number',
      initialValue: 200,
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Global Settings'}
    },
  },
})
