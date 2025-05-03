import { motion } from 'framer-motion'
import { FiLogOut, FiUser } from 'react-icons/fi'
import { useState } from 'react'
import { useNavigate } from "react-router-dom";

const TutorSidebar = ({ activeTab, setActiveTab, tabs }) => {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  const tutorProfile = {
    name: 'Ahmed Khan',
    email: 'ahmed.khan@example.com',
    phone: '9876543210',
    center: 'Malakpet Center',
    joinDate: '2023-01-15'
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    navigate("/tutor");
  };

  return (
    <aside className="w-64 bg-white shadow-xl fixed h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="p-6 border-b border-blue-100">
        <div 
          className="flex items-center cursor-pointer"
          onClick={() => setShowProfile(!showProfile)}
        >
          <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-accent-600 mr-3">
            <FiUser size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{tutorProfile.name}</h2>
            <p className="text-sm text-gray-600">{tutorProfile.center}</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center px-6 py-3 text-left transition-all duration-300 relative ${
              activeTab === tab.id
                ? 'text-accent-600 bg-accent-50 border-r-4 border-accent-600'
                : 'text-gray-600 hover:bg-accent-50 hover:text-accent-600'
            }`}
          >
            <span className="mr-3 transition-transform duration-300 transform group-hover:scale-110">
              {tab.icon}
            </span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

      {showProfile && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50"
        >
          <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
          <div className="space-y-2">
            <p className="text-sm">
              <span className="text-gray-600">Email:</span> {tutorProfile.email}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Phone:</span> {tutorProfile.phone}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Center:</span> {tutorProfile.center}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Join Date:</span> {tutorProfile.joinDate}
            </p>
          </div>
        </motion.div>
      )}

      <div className="absolute bottom-0 w-full p-6 border-t border-blue-100 bg-white bg-opacity-80 backdrop-blur-sm">
        <button 
        type="submit"
        onClick={handleLogout}
        className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-300">
          <FiLogOut className="mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default TutorSidebar