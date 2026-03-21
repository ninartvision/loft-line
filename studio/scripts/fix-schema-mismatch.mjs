#!/usr/bin/env node

import sanityCli from 'sanity/cli'

const PROJECT_ID = '4n3g4zv5'
const DATASET = 'production'
const API_VERSION = '2024-01-01'

const LEGACY_HERO_FIELD_MAP = {
  btnPrimaryLabel_ka: 'btnPrimary_ka',
  btnPrimaryLabel_en: 'btnPrimary_en',
  btnPrimaryUrl: 'btnPrimary_url',
  btnSecondaryLabel_ka: 'btnSecondary_ka',
  btnSecondaryLabel_en: 'btnSecondary_en',
  btnSecondaryUrl: 'btnSecondary_url',
}

const args = new Set(process.argv.slice(2))
const shouldWrite = args.has('--write')
const tokenArg = process.argv.slice(2).find((arg) => arg.startsWith('--token='))
const token = tokenArg?.slice('--token='.length) || process.env.SANITY_TOKEN || process.env.SANITY_AUTH_TOKEN

const queryUrl = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`
const mutateUrl = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`

async function sanityQuery(query) {
  const response = await fetch(`${queryUrl}?query=${encodeURIComponent(query)}`)

  if (!response.ok) {
    throw new Error(`Query failed with HTTP ${response.status}`)
  }

  const payload = await response.json()
  return payload.result
}

async function sanityMutate(mutations) {
  if (!token) {
    const cliClient = sanityCli.getCliClient({apiVersion: API_VERSION})
    return cliClient.mutate(mutations)
  }

  const response = await fetch(mutateUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({mutations}),
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Mutation failed with HTTP ${response.status}: ${message}`)
  }

  return response.json()
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

function buildHeroPatch(documentId, heroFieldName, heroValue) {
  const set = {}
  const unset = []
  const conflicts = []

  for (const [legacyField, currentField] of Object.entries(LEGACY_HERO_FIELD_MAP)) {
    const legacyValue = heroValue?.[legacyField]
    const currentValue = heroValue?.[currentField]

    if (!hasValue(legacyValue)) {
      continue
    }

    if (hasValue(currentValue) && currentValue !== legacyValue) {
      conflicts.push({legacyField, currentField, legacyValue, currentValue})
      continue
    }

    if (!hasValue(currentValue)) {
      set[`${heroFieldName}.${currentField}`] = legacyValue
    }

    unset.push(`${heroFieldName}.${legacyField}`)
  }

  return {
    documentId,
    set,
    unset,
    conflicts,
  }
}

function buildPatch(document) {
  if (document._type === 'homepage') {
    return buildHeroPatch(document._id, 'heroSection', document.heroSection)
  }

  if (document._type === 'pageContent') {
    return buildHeroPatch(document._id, 'hero', document.hero)
  }

  if (document._type === 'product' && document._system) {
    return {
      documentId: document._id,
      set: {},
      unset: ['_system'],
      conflicts: [],
    }
  }

  return {
    documentId: document._id,
    set: {},
    unset: [],
    conflicts: [],
  }
}

function toMutation(patch) {
  const mutation = {
    patch: {
      id: patch.documentId,
    },
  }

  if (Object.keys(patch.set).length > 0) {
    mutation.patch.set = patch.set
  }

  if (patch.unset.length > 0) {
    mutation.patch.unset = patch.unset
  }

  return mutation
}

function printSummary(patches, conflicts) {
  console.log(`Mode: ${shouldWrite ? 'write' : 'dry-run'}`)
  console.log(`Documents to patch: ${patches.length}`)

  for (const patch of patches) {
    console.log(`\n${patch.documentId}`)

    if (Object.keys(patch.set).length > 0) {
      console.log('  set')
      for (const [path, value] of Object.entries(patch.set)) {
        console.log(`    ${path} = ${JSON.stringify(value)}`)
      }
    }

    if (patch.unset.length > 0) {
      console.log('  unset')
      for (const path of patch.unset) {
        console.log(`    ${path}`)
      }
    }
  }

  if (conflicts.length > 0) {
    console.log('\nConflicts detected. These fields were left unchanged:')
    for (const conflict of conflicts) {
      console.log(
        `  ${conflict.documentId}: ${conflict.legacyField} -> ${conflict.currentField} ` +
          `(legacy=${JSON.stringify(conflict.legacyValue)}, current=${JSON.stringify(conflict.currentValue)})`,
      )
    }
  }
}

async function main() {
  const documents = await sanityQuery(`
    *[_type in ["homepage", "pageContent", "product"]]{
      _id,
      _type,
      heroSection,
      hero,
      _system
    }
  `)

  const patches = []
  const conflicts = []

  for (const document of documents) {
    const patch = buildPatch(document)

    if (patch.conflicts.length > 0) {
      conflicts.push(
        ...patch.conflicts.map((conflict) => ({
          documentId: patch.documentId,
          ...conflict,
        })),
      )
    }

    if (Object.keys(patch.set).length > 0 || patch.unset.length > 0) {
      patches.push(patch)
    }
  }

  printSummary(patches, conflicts)

  if (!shouldWrite) {
    console.log('\nDry run only. Re-run with --write and a token to apply patches.')
    return
  }

  if (patches.length === 0) {
    console.log('\nNo mutations needed.')
    return
  }

  const mutations = patches.map(toMutation)
  await sanityMutate(mutations)

  console.log('\nMutations applied successfully.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})