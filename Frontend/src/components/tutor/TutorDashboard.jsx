import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiGrid, FiUsers, FiLogOut } from 'react-icons/fi'
import TutorSidebar from './TutorSidebar'
import TutorOverview from './TutorOverview'
import TutorStudents from './TutorStudents'

const TutorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <TutorOverview />
      case 'students':
        return <TutorStudents />
      default:
        return <TutorOverview />
    }
  }

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: <FiGrid /> },
    { id: 'students', label: 'Students', icon: <FiUsers /> }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex">
        <TutorSidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
        
        <main className="flex-1 ml-64 p-8">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  )
}

export default TutorDashboard