import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import TutorPage from './pages/TutorPage'
import AdminDashboard from './components/admin/AdminDashboard'
import TutorDashboard from './components/tutor/TutorDashboard'
import { CenterRefetchProvider } from './context/CenterRefetchContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  
  if (!token || userRole !== 'admin') {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    return <Navigate to="/admin" replace />;
  }
  
  return children;
};

function App() {
  return (
    <CenterRefetchProvider>
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/tutor" element={<TutorPage />} />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
        </Routes>
      </main>
      <ToastContainer />
      {/* <Footer /> */}
    </div>
    </CenterRefetchProvider>
  )
}

export default App