#!/usr/bin/env node

import { main as updateTags } from './update-tags.mjs'

console.log('🔍 Pre-commit: Checking for new tags...')

try {
  updateTags()
  console.log('✅ Pre-commit: Tags updated successfully')
} catch (error) {
  console.error('❌ Pre-commit: Failed to update tags:', error.message)
  process.exit(1)
}
