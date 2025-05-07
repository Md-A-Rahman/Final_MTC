import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Overview from './Overview';
import TutorManagement from './TutorManagement';
import CenterManagement from './CenterManagement';
import ReportManagement from './ReportManagement';
import StudentManagement from './StudentManagement';
import AdminManagement from './AdminManagement';
import HadiyaManagement from './HadiyaManagement'; // Added HadiyaManagement import

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = () => {
      const userData = localStorage.getItem('userData');
      if (!userData) {
        navigate('/admin');
        return;
      }

      try {
        const parsedData = JSON.parse(userData);
        if (!parsedData || !parsedData._id || !parsedData.token || parsedData.role !== 'admin') {
          localStorage.removeItem('userData');
          navigate('/admin');
          return;
        }
        setUser(parsedData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('userData');
        navigate('/admin');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
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
        return <ReportManagement />;
      case 'students':
        return <StudentManagement />;
      case 'admins':
        return <AdminManagement />;
      case 'hadiya': // Added hadiya case
        return <HadiyaManagement />;
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Welcome, {user?.name}</h1>
            <p className="text-gray-600">Select a section from the sidebar to get started.</p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
