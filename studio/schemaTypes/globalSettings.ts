import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'globalSettings',
  title: 'Global Settings / გლობალური პარამეტრები',
  type: 'document',

  // Singleton — only one document (ID: global-settings-singleton)
  // Managed via structureTool in sanity.config.ts

  fields: [
    // ── Contact & Brand ───────────────────────────────────────────
    defineField({name: 'site_name',  title: 'Site Name',      type: 'string'}),
    defineField({name: 'site_url',   title: 'Site URL',        type: 'url'}),
    defineField({name: 'phone',      title: 'Phone',           type: 'string'}),
    defineField({name: 'email',      title: 'Email',           type: 'string'}),
    defineField({name: 'facebook',   title: 'Facebook URL',    type: 'url'}),
    defineField({name: 'instagram',  title: 'Instagram URL',   type: 'url'}),
    defineField({
      name: 'whatsapp_number',
      title: 'WhatsApp Number',
      type: 'string',
      description: 'International format: +995XXXXXXXXX',
    }),

    // ── Delivery & Guarantee ──────────────────────────────────────
    defineField({
      name: 'free_delivery_threshold',
      title: 'Free Delivery Threshold ₾',
      type: 'number',
      initialValue: 200,
    }),
    defineField({
      name: 'delivery_days_ka',
      title: 'Delivery Time (KA)',
      type: 'string',
      description: 'Shown in product pages. e.g. 3–7 სამუშაო დღე',
      initialValue: '3–7 სამუშაო დღე',
    }),
    defineField({
      name: 'delivery_days_en',
      title: 'Delivery Time (EN)',
      type: 'string',
      initialValue: '3–7 business days',
    }),
    defineField({
      name: 'default_guarantee_ka',
      title: 'Default Guarantee Text (KA)',
      type: 'string',
      initialValue: '2 წლის გარანტია',
    }),
    defineField({
      name: 'default_guarantee_en',
      title: 'Default Guarantee Text (EN)',
      type: 'string',
      initialValue: '2-year guarantee',
    }),

    // ── Working Hours ─────────────────────────────────────────────
    defineField({
      name: 'working_hours_ka',
      title: 'Working Hours (KA)',
      type: 'string',
      initialValue: 'ორშაბათიდან პარასკევის 10:00–19:00',
    }),
    defineField({
      name: 'working_hours_en',
      title: 'Working Hours (EN)',
      type: 'string',
      initialValue: 'Mon–Fri 10:00–19:00',
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Global Settings'}
    },
  },
})
