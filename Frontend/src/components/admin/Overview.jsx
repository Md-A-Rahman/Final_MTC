import { motion } from 'framer-motion'
import { FiUsers, FiMapPin, FiClock, FiTrendingUp } from 'react-icons/fi'

const Overview = () => {
  const stats = [
    { label: 'Total Tutors', value: '45', icon: <FiUsers />, color: 'from-blue-500 to-blue-600' },
    { label: 'Active Centers', value: '12', icon: <FiMapPin />, color: 'from-green-500 to-green-600' },
    { label: 'Today\'s Attendance', value: '92%', icon: <FiClock />, color: 'from-purple-500 to-purple-600' },
    // { label: 'Student Growth', value: '+15%', icon: <FiTrendingUp />, color: 'from-orange-500 to-orange-600' }
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
        Dashboard Overview
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
          >
            <div className="flex items-center">
              <div className={`bg-gradient-to-r ${stat.color} p-3 rounded-lg text-white mr-4`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  {stat.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-sm bg-opacity-80">
        <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[
            { time: '2 hours ago', text: 'MA Rahman filled attendance' },
            { time: '3 hours ago', text: 'Safi filled attendance' },
            // { time: '5 hours ago', text: 'Zain filled attendance' }
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center py-3 border-b border-gray-100 last:border-0 hover:bg-blue-50 rounded-lg px-4 transition-colors duration-300"
            >
              <div className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mr-4"></div>
              <div>
                <p className="text-gray-800 font-medium">{activity.text}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Overview