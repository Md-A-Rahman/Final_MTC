import { motion } from 'framer-motion'
import { FiUsers, FiMapPin, FiClock, FiUser, FiCheck } from 'react-icons/fi'
import useGet from '../CustomHooks/useGet'
import { useMemo } from 'react'
import { format } from 'date-fns'

const Overview = () => {
  // Fetch tutors, centers, and tutor applications
  const { response: tutors, loading: tutorsLoading } = useGet('/tutors')
  const { response: centers, loading: centersLoading } = useGet('/centers')
  const { response: tutorApps, loading: appsLoading } = useGet('/tutor-applications')

  // Get all attendance records from tutors
  const attendanceRecords = useMemo(() => {
    if (!tutors) return [];
    return tutors.flatMap(tutor => 
      tutor.attendance?.map(record => ({
        ...record,
        tutorName: tutor.name,
        tutorId: tutor._id
      })) || []
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [tutors]);

  // Placeholder attendance percentage logic
  const attendancePercentage = useMemo(() => {
    return tutors && tutors.length > 0 ? 'N/A' : '0%'
  }, [tutors])

  const stats = [
    { label: 'Total Tutors', value: tutorsLoading ? '...' : tutors?.length || 0, icon: FiUsers },
    { label: 'Total Centers', value: centersLoading ? '...' : centers?.length || 0, icon: FiMapPin },
    { label: 'Attendance', value: attendancePercentage, icon: FiClock }
  ]

  // Format date for recent activity
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {tutorsLoading ? (
            <p>Loading recent activity...</p>
          ) : attendanceRecords.length > 0 ? (
            attendanceRecords.slice(0, 5).map((record, index) => (
              <motion.div
                key={`${record.tutorId}-${record.date}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FiCheck className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">{record.tutorName}</p>
                    <p className="text-sm text-gray-600">Marked attendance at {record.centerName}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(record.date)}</span>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Overview