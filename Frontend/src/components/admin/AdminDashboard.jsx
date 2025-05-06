import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiGrid, FiUsers, FiMapPin, FiFileText, FiLogOut } from 'react-icons/fi';
import Sidebar from './Sidebar';
import Overview from './Overview';
import TutorManagement from './TutorManagement';
import CenterManagement from './CenterManagement';
import Reports from './Reports';
import Students from './Students';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'admin') {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      navigate('/admin');
    }
  }, [navigate]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'tutors':
        return <TutorManagement />;
      case 'centers':
        return <CenterManagement />;
      case 'reports':
        return <Reports />;
      case 'students':
        return <Students />;
      default:
        return <Overview />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FiGrid /> },
    { id: 'tutors', label: 'Tutors', icon: <FiUsers /> },
    { id: 'centers', label: 'Centers', icon: <FiMapPin /> },
    { id: 'reports', label: 'Reports', icon: <FiFileText /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />

        {/* Main Content */}
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
  );
};

export default AdminDashboard;
