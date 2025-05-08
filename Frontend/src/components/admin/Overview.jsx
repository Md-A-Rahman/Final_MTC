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

  // Fetch recent attendance directly from Attendance collection
  const { response: recentAttendance, loading: attendanceLoading } = useGet('/attendance/recent');

  // Remove old attendanceRecords logic


  const attendancePercentage = useMemo(() => {
    if (!tutors || tutors.length === 0 || !recentAttendance) return '0%';

    const today = format(new Date(), 'yyyy-MM-dd');
    const attendedToday = new Set();

    recentAttendance.forEach(record => {
      if (
        format(new Date(record.date), 'yyyy-MM-dd') === today &&
        record.status === 'present' &&
        record.tutor && record.tutor._id
      ) {
        attendedToday.add(record.tutor._id);
      }
    });

    return `${attendedToday.size}/${tutors.length}`;
  }, [tutors, recentAttendance]);

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

  const isLoading = tutorsLoading || centersLoading || appsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-100 rounded-lg p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm h-4 w-24 bg-gray-200 rounded"></p>
                  <p className="text-2xl font-bold mt-1 h-6 w-20 bg-gray-200 rounded"></p>
                </div>
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-100 rounded-lg p-6 animate-pulse">
          <h2 className="text-xl font-semibold mb-4 h-6 bg-gray-200 rounded"></h2>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
                  <div>
                    <p className="font-medium h-4 w-24 bg-gray-200 rounded"></p>
                    <p className="text-sm text-gray-600 mt-1 h-4 w-20 bg-gray-200 rounded"></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
          {attendanceLoading ? (
            <p>Loading recent activity...</p>
          ) : recentAttendance && recentAttendance.length > 0 ? (
            recentAttendance.slice(0, 5).map((record, index) => (
              <motion.div
                key={record._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FiCheck className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium">{record.tutor?.name || 'Unknown Tutor'}</p>
                    <p className="text-sm text-gray-600">Marked attendance at {record.center?.name || 'Unknown Center'}</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(record.createdAt)}</span>
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