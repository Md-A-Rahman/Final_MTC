import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import { FiUsers, FiClock, FiCheck, FiX } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const LocationMarker = ({ onLocationUpdate }) => {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map.locate().on("locationfound", function (e) {
      setPosition(e.latlng)
      map.flyTo(e.latlng, map.getZoom())
      onLocationUpdate(e.latlng)
    })
  }, [map])

  return position === null ? null : <Marker position={position} />
}

const TutorOverview = () => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationMatch, setLocationMatch] = useState(null)
  const [attendanceMarked, setAttendanceMarked] = useState(false)

  // Sample center location (this would come from backend)
  const centerLocation = { lat: 17.3850, lng: 78.4867 }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLocationUpdate = (location) => {
    setCurrentLocation(location)
    // Calculate distance between current location and center location
    const distance = calculateDistance(location, centerLocation)
    setLocationMatch(distance <= 0.1) // Within 100 meters
  }

  const calculateDistance = (loc1, loc2) => {
    // Haversine formula to calculate distance between two points
    const R = 6371 // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleMarkAttendance = () => {
    if (locationMatch) {
      setAttendanceMarked(true)
      // Here you would make an API call to mark attendance
    }
  }

  const handleReset = () => {
    setCurrentLocation(null)
    setLocationMatch(null)
    setAttendanceMarked(false)
  }

  const stats = [
    { label: 'Total Students', value: '45', icon: <FiUsers /> },
    { label: 'Assigned Students', value: '15', icon: <FiUsers /> },
    { label: 'Today\'s Time', value: currentTime.toLocaleTimeString(), icon: <FiClock /> }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-center">
              <div className="bg-accent-100 p-3 rounded-lg text-accent-600 mr-4">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
        <div className="h-[400px] rounded-lg overflow-hidden mb-4">
          <MapContainer
            center={[17.3850, 78.4867]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <LocationMarker onLocationUpdate={handleLocationUpdate} />
            <Marker position={[centerLocation.lat, centerLocation.lng]} />
          </MapContainer>
        </div>

        <div className="flex items-center justify-between">
          <div>
            {locationMatch !== null && (
              <p className={`text-lg ${locationMatch ? 'text-green-600' : 'text-red-600'}`}>
                {locationMatch 
                  ? 'Location verified. You can mark your attendance.'
                  : 'Location does not match. Cannot mark attendance.'}
              </p>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleMarkAttendance}
              disabled={!locationMatch || attendanceMarked}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                locationMatch && !attendanceMarked
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {attendanceMarked ? <FiCheck className="mr-2" /> : null}
              {attendanceMarked ? 'Attendance Marked' : 'Mark Attendance'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default TutorOverview