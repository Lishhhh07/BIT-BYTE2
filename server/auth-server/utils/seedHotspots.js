import Hotspot from '../models/Hotspot.js'
import { readFile } from 'fs/promises'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const seedHotspots = async () => {
  try {
    // Check if hotspots already exist
    const count = await Hotspot.countDocuments()
    
    if (count > 0) {
      console.log(`✅ Hotspots already seeded (${count} hotspots found)`)
      return
    }

    // Read the hotspots.json file
    const hotspotsPath = join(__dirname, '../../seeds/hotspot.json')
    const fileContent = await readFile(hotspotsPath, 'utf-8')
    const hotspots = JSON.parse(fileContent)

    // Insert hotspots into database
    await Hotspot.insertMany(hotspots)
    
    console.log(`✅ Seeded ${hotspots.length} deforestation hotspots`)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn('⚠️  hotspots.json file not found. Skipping seed.')
    } else {
      console.error('❌ Error seeding hotspots:', error.message)
    }
  }
}

