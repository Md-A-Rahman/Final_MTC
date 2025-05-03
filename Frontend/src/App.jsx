import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import AdminPage from './pages/AdminPage'
import TutorPage from './pages/TutorPage'
import AdminDashboard from './components/admin/AdminDashboard'
import TutorDashboard from './components/tutor/TutorDashboard'


function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
        </Routes>
      </main>
      <ToastContainer />
      {/* <Footer /> */}
    </div>
  )
}

export default App