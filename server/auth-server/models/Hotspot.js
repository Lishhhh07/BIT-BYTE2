import mongoose from 'mongoose'

const hotspotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    risk_level: {
      type: String,
      required: true,
      enum: ['Critical', 'High', 'Medium', 'Low'],
    },
  },
  {
    timestamps: true,
  }
)

// Index for geospatial queries
hotspotSchema.index({ lat: 1, lng: 1 })

const Hotspot = mongoose.model('Hotspot', hotspotSchema)

export default Hotspot

