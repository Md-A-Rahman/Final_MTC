import { motion } from 'framer-motion'
import { FiLogOut } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

const Sidebar = ({ activeTab, setActiveTab, tabs }) => {
  const navigate = useNavigate()
  const HandleLogout = () => {
    navigate('/')
  }
  return (
    <aside className="w-64 bg-white shadow-xl fixed h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="p-6 border-b border-blue-100">
        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h2>
      </div>
      
      <nav className="mt-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center px-6 py-3 text-left transition-all duration-300 relative ${
              activeTab === tab.id
                ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600'
                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="mr-3 transition-transform duration-300 transform group-hover:scale-110">
              {tab.icon}
            </span>
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-6 border-t border-blue-100 bg-white bg-opacity-80 backdrop-blur-sm">
        <button onClick={HandleLogout} className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-300">
          <FiLogOut className="mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar