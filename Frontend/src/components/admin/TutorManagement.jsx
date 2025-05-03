import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGet from '../CustomHooks/useGet'
import useGetTutors from "../CustomHooks/useGetTutors"
import { FiUser, FiMail, FiPhone, FiBook, FiMapPin, FiClock, FiUpload, FiX, FiDownload, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi'
import Papa from 'papaparse'
import { toast } from 'react-hot-toast'

const TutorManagement = () => {
  const [editingTutor, setEditingTutor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('')
  const [error, setError] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsPerPage = 10

  const { response: tutors, loading, error: tutorsError } = useGet("/tutors", refreshKey);
  const { response: centers } = useGet("/centers");

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'tutor@123',
    assignmentInfo: '',
    assignedCenter: '',
    subjects: [],
    sessionType: '',
    sessionTiming: ''
  })

  const subjects = [
    'Mathematics',
    'Science',
    'English',
    'Social Studies',
    'Islamic Studies',
    'Urdu',
    'Hindi'
  ]

  const handleEdit = (tutor) => {
    setEditingTutor(tutor);
    setFormData({
      name: tutor.name,
      email: tutor.email,
      phone: tutor.phone,
      password: 'tutor@123', // Don't show existing password
      assignmentInfo: tutor.assignmentInformation || '',
      assignedCenter: tutor.assignedCenter?._id || tutor.assignedCenter,
      subjects: tutor.subjects || [],
      sessionType: tutor.sessionType,
      sessionTiming: tutor.sessionTiming
    });
    setShowForm(true);
  };

  const handleFormClose = () => {
    if (Object.values(formData).some(value => value !== '')) {
      setShowConfirmClose(true);
    } else {
      setShowForm(false);
      setEditingTutor(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: 'tutor@123',
      assignmentInfo: '',
      assignedCenter: '',
      subjects: [],
      sessionType: '',
      sessionTiming: ''
    });
  };

  const confirmClose = () => {
    setShowForm(false);
    setShowConfirmClose(false);
    setEditingTutor(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShowErrorAlert(false);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name || !formData.email || !formData.phone || 
          !formData.assignedCenter || !formData.subjects?.length || !formData.sessionType || !formData.sessionTiming) {
        setError('Please fill in all required fields');
        setShowErrorAlert(true);
        setIsSubmitting(false);
        return;
      }

      // Get the selected center
      const selectedCenter = centers?.find(c => c._id === formData.assignedCenter);
      if (!selectedCenter) {
        setError('Please select a valid center');
        setShowErrorAlert(true);
        setIsSubmitting(false);
        return;
      }

      // Format the data according to backend validation rules
      const formattedData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        assignedCenter: selectedCenter._id,
        centerName: selectedCenter.name,
        subjects: formData.subjects,
        sessionType: formData.sessionType,
        sessionTiming: formData.sessionTiming,
        assignmentInformation: formData.assignmentInfo || ''
      };

      // Always include password for new tutors, or if it's been changed for existing tutors
      if (!editingTutor) {
        formattedData.password = formData.password;
      } else if (formData.password && formData.password !== 'tutor@123') {
        formattedData.password = formData.password;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to continue');
        setShowErrorAlert(true);
        setIsSubmitting(false);
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const url = editingTutor 
        ? `http://localhost:5000/api/tutors/${editingTutor._id}`
        : 'http://localhost:5000/api/tutors';

      const response = await fetch(url, {
        method: editingTutor ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formattedData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Your session has expired. Please login again.');
          setShowErrorAlert(true);
          setIsSubmitting(false);
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
        if (data.message?.includes('already exists')) {
          setError('A tutor with this phone number already exists. Please use a different phone number.');
          setShowErrorAlert(true);
          setShowForm(false);
          setIsSubmitting(false);
          return;
        }
        if (data.errors && data.errors.length > 0) {
          setError(data.errors.map(error => error.msg).join(', '));
          setShowErrorAlert(true);
          setShowForm(false);
          setIsSubmitting(false);
          return;
        }
        setError(data.message || 'Invalid data');
        setShowErrorAlert(true);
        setShowForm(false);
        setIsSubmitting(false);
        return;
      }

      toast.success(editingTutor ? 'Tutor updated successfully!' : 'Tutor created successfully!', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });
      setShowForm(false);
      setEditingTutor(null);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving tutor:', error);
      setError(error.message || 'Failed to save tutor');
      setShowErrorAlert(true);
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const data = tutors.map(tutor => ({
      'Full Name': tutor.name,
      'Email': tutor.email,
      'Phone': tutor.phone,
      'Center': tutor.centerID,
      // 'Subjects': tutor.subjects.join(', '),
      'Session Type': tutor.sessionType || "N/A",
      'Session Timing': tutor.sessionTiming || "N/A",
      'Join Date': tutor.joinDate || "N/A",
      'Status': tutor.status || "Active"
    }))

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'tutors.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getCenterName = (tutor) => {
    if (!tutor) return "Unknown Center";
    if (tutor.centerName) return tutor.centerName;
    if (tutor.assignedCenter) {
      const center = centers?.find(c => c._id === tutor.assignedCenter);
      return center?.name || "Unknown Center";
    }
    return "Unknown Center";
  };

  const handleDelete = async (tutor) => {
    setTutorToDelete(tutor);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!tutorToDelete) return;
    
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to continue');
        setShowErrorAlert(true);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/tutors/${tutorToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete tutor');
      }

      toast.success('Tutor deleted successfully!', {
        duration: 3000,
        style: {
          background: '#10b981',
          color: '#fff',
          padding: '16px',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      setError(error.message);
      setShowErrorAlert(true);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setTutorToDelete(null);
    }
  };

  const renderTutorRow = (tutor) => (
    <tr
      key={tutor._id}
      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isLoading ? 'opacity-50' : ''}`}
      onClick={() => !isLoading && setShowProfile(tutor)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium">
            {tutor.name.charAt(0)}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
            <div className="text-sm text-gray-500">{tutor.qualifications || 'Qualifications pending'}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{tutor.email}</div>
        <div className="text-sm text-gray-500">{tutor.phone}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{getCenterName(tutor)}</div>
        <div className="text-sm text-gray-500">
          {tutor.subjects?.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {tutor.subjects.map((subject, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  {subject}
                </span>
              ))}
            </div>
          ) : (
            'Subjects pending'
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 capitalize">{tutor.sessionType}</div>
        <div className="text-sm text-gray-500 capitalize">{tutor.sessionTiming?.replace(/_/g, ' ')}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
          tutor.status === 'active' ? 'bg-green-100 text-green-800' : 
          tutor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
          'bg-red-100 text-red-800'
        }`}>
          {tutor.status || 'pending'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(tutor);
            }}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            disabled={isLoading}
          >
            <FiEdit2 size={18} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(tutor);
            }}
            className="text-red-600 hover:text-red-800 transition-colors"
            disabled={isLoading || isDeleting}
          >
            <FiTrash2 size={18} />
          </button>
        </div>
      </td>
    </tr>
  );

  const renderTutorProfile = (tutor) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl"
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Tutor Profile
          </h2>
          <button
            onClick={() => setShowProfile(null)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-6">
          <div className="flex items-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-medium">
              {tutor.name.charAt(0)}
            </div>
            <div className="ml-6">
              <h3 className="text-xl font-bold text-gray-900">{tutor.name}</h3>
              <p className="text-gray-500">{tutor.qualifications || 'Qualifications pending'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{tutor.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{tutor.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Center</p>
              <p className="font-medium">{getCenterName(tutor)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Join Date</p>
              <p className="font-medium">{new Date(tutor.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Session Type</p>
              <p className="font-medium capitalize">{tutor.sessionType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Session Timing</p>
              <p className="font-medium capitalize">{tutor.sessionTiming?.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Subjects</p>
            <div className="flex flex-wrap gap-2">
              {tutor.subjects?.map((subject, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {subject}
                </span>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Pending Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {!tutor.qualifications && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">Qualifications not provided</p>
                </div>
              )}
              {!tutor.documents?.aadharNumber && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">Aadhar details pending</p>
                </div>
              )}
              {!tutor.documents?.bankAccount?.accountNumber && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">Bank details pending</p>
                </div>
              )}
              {tutor.sessionType === 'tuition' && !tutor.documents?.certificates && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">Certificates pending</p>
                </div>
              )}
              {tutor.sessionType === 'tuition' && !tutor.documents?.memos && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">Memos pending</p>
                </div>
              )}
              {tutor.sessionType === 'tuition' && !tutor.documents?.resume && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">Resume pending</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  const renderDeleteConfirm = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Tutor</h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete {tutorToDelete?.name}? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => {
              setShowDeleteConfirm(false);
              setTutorToDelete(null);
            }}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading tutors...</span>
      </div>
    );
  }

  if (tutorsError) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {tutorsError.includes('login') ? (
                <>
                  Please <a href="/login" className="text-blue-600 hover:text-blue-500">login</a> to view tutors
                </>
              ) : (
                tutorsError
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!tutors || !Array.isArray(tutors)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">No tutors found</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>There are no tutors in the system yet.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredTutors = tutors.filter(tutor => {
    if (!tutor) return false;
    
    const tutorName = tutor.name || '';
    const tutorEmail = tutor.email || '';
    const tutorPhone = tutor.phone || '';
    
    const matchesSearch = searchTerm === '' || 
      tutorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorPhone.includes(searchTerm);
      
    const matchesCenter = !selectedCenter || 
      (tutor.assignedCenter && 
        (typeof tutor.assignedCenter === 'string' ? 
          tutor.assignedCenter === selectedCenter : 
          tutor.assignedCenter._id === selectedCenter));
    
    return matchesSearch && matchesCenter;
  });

  const totalPages = Math.ceil(filteredTutors.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTutors = filteredTutors.slice(startIndex, startIndex + itemsPerPage);
  return (
    <div className="space-y-6">
      {showErrorAlert && error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Tutor Management
        </h1>
        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            <FiDownload className="mr-2" /> Export CSV
          </button>
          <button
            onClick={() => {
              setEditingTutor(null);
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Add New Tutor
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tutors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-64">
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">All Centers</option>
                {centers?.map(center => (
                  <option key={center._id} value={center._id}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center & Subjects
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTutors.map(renderTutorRow)}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredTutors.length)}
              </span>{' '}
              of <span className="font-medium">{filteredTutors.length}</span> results
            </span>
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {editingTutor ? 'Edit Tutor' : 'Add New Tutor'}
                </h2>
                <button
                  onClick={handleFormClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              {showConfirmClose && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                  <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md">
                    <h3 className="text-lg font-semibold mb-4">Discard Changes?</h3>
                    <p className="text-gray-600 mb-6">You have unsaved changes. Are you sure you want to close the form?</p>
                    <div className="flex justify-end space-x-4">
                      <button
                        onClick={() => setShowConfirmClose(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmClose}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiUser size={18} />
                      </div>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiMail size={18} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiPhone size={18} />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        pattern="[0-9]{10}"
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">10-digit mobile number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Default password: tutor@123</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Notes/Remarks (Optional)
                  </label>
                  <textarea
                    name="assignmentInfo"
                    value={formData.assignmentInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, assignmentInfo: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter any notes or remarks about the tutor's assignment..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Center <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="assignedCenter"
                      value={formData.assignedCenter}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedCenter: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a center</option>
                      {centers?.map(center => (
                        <option key={center._id} value={center._id}>
                          {center.name}
                        </option>
                      ))}
                    </select>
                    {!formData.assignedCenter && (
                      <p className="mt-1 text-sm text-red-600">Please select a center</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned Subjects <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {subjects.map((subject, index) => (
                        <label key={`subject-${index}`} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            name="subjects"
                            value={subject}
                            checked={formData.subjects?.includes(subject)}
                            onChange={(e) => {
                              const subjects = e.target.checked ? [...formData.subjects, e.target.value] : formData.subjects.filter(s => s !== e.target.value);
                              setFormData(prev => ({ ...prev, subjects }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="sessionType"
                      value={formData.sessionType}
                      onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select session type</option>
                      <option value="arabic">Arabic</option>
                      <option value="tuition">Tuition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Session Timing <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <FiClock size={18} />
                      </div>
                      <select
                        name="sessionTiming"
                        value={formData.sessionTiming}
                        onChange={(e) => setFormData(prev => ({ ...prev, sessionTiming: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select timing</option>
                        <option value="after_fajr">After Fajr</option>
                        <option value="after_zohar">After Zohar</option>
                        <option value="after_asar">After Asar</option>
                        <option value="after_maghrib">After Maghrib</option>
                        <option value="after_isha">After Isha</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleFormClose}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingTutor ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingTutor ? 'Update Tutor' : 'Add Tutor'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showProfile && renderTutorProfile(showProfile)}
      </AnimatePresence>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-gray-600">Processing...</span>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showDeleteConfirm && renderDeleteConfirm()}
      </AnimatePresence>
    </div>
  )
}

export default TutorManagement

