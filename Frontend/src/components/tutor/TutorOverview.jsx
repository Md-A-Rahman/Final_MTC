import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { FiUsers, FiClock, FiCheck, FiX } from 'react-icons/fi'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import useGet from '../CustomHooks/useGet'
import usePost from '../CustomHooks/usePost'
import useTodayAttendance from './useTodayAttendance'

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom marker icons
const createCustomIcon = (color) => {
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  })
}

const redIcon = createCustomIcon('red')
const blueIcon = createCustomIcon('blue')

const LocationMarker = ({ onLocationUpdate }) => {
  const [position, setPosition] = useState(null)
  const map = useMap()

  useEffect(() => {
    map.locate({
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }).on("locationfound", function (e) {
      const newPosition = e.latlng
      setPosition(newPosition)
      map.flyTo(newPosition, map.getZoom())
      onLocationUpdate(newPosition)
    }).on("locationerror", function (e) {
      console.error("Location error:", e.message)
    })
  }, [map])

  return position === null ? null : <Marker position={position} icon={redIcon} />
}

import { useRef } from 'react';

const TutorOverview = () => {
  const { alreadyMarked, loading: attendanceCheckLoading, error: attendanceCheckError } = useTodayAttendance();
  const [showDeniedPopover, setShowDeniedPopover] = useState(false);
  const popoverRef = useRef();

  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationMatch, setLocationMatch] = useState(null)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  const [error, setError] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [distance, setDistance] = useState(null)

  // Get tutor data from localStorage
  const tutorData = JSON.parse(localStorage.getItem('userData') || '{}')
  const { post } = usePost()

  // Get center location from tutor data
  const centerLocation = tutorData.assignedCenter?.coordinates
    ? {
        lat: parseFloat(tutorData.assignedCenter.coordinates[0]),
        lng: parseFloat(tutorData.assignedCenter.coordinates[1])
      }
    : null

  // Fetch students
  const { response: students, loading } = useGet('/students')

  // Calculate counts
  const totalStudents = students ? students.length : 0
  const assignedStudents = students ? students.filter(s => (s.assignedTutor && (s.assignedTutor._id || s.assignedTutor) === tutorData._id)).length : 0

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLocationUpdate = (location) => {
    setCurrentLocation(location)
    if (centerLocation) {
      // Calculate distance between current location and center location
      const calculatedDistance = calculateDistance(location, centerLocation)
      setDistance(calculatedDistance)
      setLocationMatch(calculatedDistance <= 1.3) // Within 1300 meters (1.3 km)
    }
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

  const handleMarkAttendance = async () => {
    if (locationMatch && currentLocation) {
      try {
        const userDataString = localStorage.getItem('userData'); // Changed from 'user' to 'userData' for consistency
        const token = userDataString ? JSON.parse(userDataString).token : null;
        if (!token) {
          throw new Error('Authentication token not found')
        }

        const response = await fetch('http://localhost:5000/api/tutors/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            currentLocation: [currentLocation.lat, currentLocation.lng]
          })
        })

        const data = await response.json()
        if (data.message === 'Attendance submitted successfully') {
          setAttendanceMarked(true)
          setError(null)
        }
      } catch (error) {
        // Detect duplicate key error (E11000) from backend
        if (error.message && error.message.includes('E11000')) {
          setShowDeniedPopover(true);
        } else {
          setError(error.message || 'Failed to mark attendance');
        }
        console.error('Error marking attendance:', error);
      }
    }
  }

  const handleReset = () => {
    setCurrentLocation(null)
    setLocationMatch(null)
    setAttendanceMarked(false)
    setError(null)
    setLocationError(null)
  }

  if (!centerLocation) {
    return <div className="text-center text-red-600 p-4">
      Unable to load center location. Please log in again.
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
           <div>
             <div className="text-2xl font-bold text-accent-600">
               {loading ? (
                 <svg className="animate-spin h-6 w-6 text-accent-600 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                 </svg>
               ) : totalStudents}
             </div>
             <div className="text-gray-600">Total Students</div>
           </div>
          <FiUsers className="text-4xl text-accent-400" />
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6 flex items-center justify-between">
           <div>
             <div className="text-2xl font-bold text-accent-600">
               {loading ? (
                 <svg className="animate-spin h-6 w-6 text-accent-600 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                 </svg>
               ) : assignedStudents}
             </div>
             <div className="text-gray-600">My Assigned Students</div>
           </div>
          <FiCheck className="text-4xl text-primary-400" />
        </div>
      </div>

      {showDeniedPopover && (
        <div ref={popoverRef} className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full flex flex-col items-center">
            <div className="text-red-600 text-2xl font-bold mb-2">Request Denied</div>
            <div className="text-gray-800 mb-4">Attendance has already been marked for today.</div>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
              onClick={() => setShowDeniedPopover(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4">Mark Attendance</h2>
        {attendanceCheckLoading ? (
          <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded">Checking attendance status...</div>
        ) : alreadyMarked ? (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">Today's attendance has already been marked.</div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
                {error}
              </div>
            )}
            {locationError && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg">
                {locationError}
              </div>
            )}
            <div className="h-[400px] rounded-lg overflow-hidden mb-4">
              <MapContainer
                center={[centerLocation.lat, centerLocation.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <LocationMarker onLocationUpdate={handleLocationUpdate} />
                <Marker 
                  position={[centerLocation.lat, centerLocation.lng]} 
                  icon={blueIcon}
                />
                <Circle
                  center={[centerLocation.lat, centerLocation.lng]}
                  radius={1300}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                />
              </MapContainer>
            </div>

            <div className="flex items-center justify-between">
              <div>
                {locationMatch !== null && (
                  <div className="space-y-2">
                    <p className={`text-lg ${locationMatch ? 'text-green-600' : 'text-red-600'}`}>
                      {locationMatch 
                        ? 'Location verified. You can mark your attendance.'
                        : 'Location does not match. Cannot mark attendance.'}
                    </p>
                    {distance !== null && (
                      <p className="text-sm text-gray-600">
                        Distance to center: {(distance * 1000).toFixed(0)} meters
                      </p>
                    )}
                  </div>
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
          </>
        )}
      </motion.div>
    </div>
  )
}

export default TutorOverview