import express from 'express'
import Hotspot from '../models/Hotspot.js'

const router = express.Router()

// Risk level priority for sorting
const riskPriority = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
}

// GET /api/locations
router.get('/', async (req, res) => {
  try {
    const hotspots = await Hotspot.find({}).sort({ name: 1 })
    
    // Sort by risk level priority (Critical > High > Medium > Low)
    const sortedHotspots = hotspots.sort((a, b) => {
      const priorityA = riskPriority[a.risk_level] || 0
      const priorityB = riskPriority[b.risk_level] || 0
      if (priorityB !== priorityA) {
        return priorityB - priorityA // Higher priority first
      }
      return a.name.localeCompare(b.name) // Then alphabetically
    })
    
    res.json({
      success: true,
      count: sortedHotspots.length,
      hotspots: sortedHotspots.map((hotspot) => ({
        id: hotspot._id,
        name: hotspot.name,
        lat: hotspot.lat,
        lng: hotspot.lng,
        risk_level: hotspot.risk_level,
      })),
    })
  } catch (error) {
    console.error('Error fetching hotspots:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hotspots',
    })
  }
})

export default router

