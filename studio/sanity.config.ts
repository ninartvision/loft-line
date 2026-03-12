import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'

export default defineConfig({
  name: 'default',
  title: 'Loft Line Studio',

  projectId: '777f2m13',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('🛋 Products / პროდუქტები')
              .child(S.documentTypeList('product')),
            S.listItem()
              .title('🏷 Categories / კატეგორიები')
              .child(S.documentTypeList('category')),
            S.divider(),
            S.listItem()
              .title('🏠 Homepage / მთავარი გვერდი')
              .child(
                S.document()
                  .schemaType('homepage')
                  .documentId('homepage-singleton')
                  .title('Homepage Content'),
              ),
            S.listItem()
              .title('📄 Category Pages / კატეგორიის გვერდები')
              .child(S.documentTypeList('pageContent')),
            S.listItem()
              .title('🖼 Galleries / გალერეა')
              .child(S.documentTypeList('gallery')),
            S.divider(),
            S.listItem()
              .title('🔍 SEO Settings')
              .child(
                S.document()
                  .schemaType('seoSettings')
                  .documentId('seo-settings-singleton')
                  .title('Global SEO Settings'),
              ),
            S.listItem()
              .title('⚙️ Global Settings / გლობალური')
              .child(
                S.document()
                  .schemaType('globalSettings')
                  .documentId('global-settings-singleton')
                  .title('Global Settings'),
              ),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
