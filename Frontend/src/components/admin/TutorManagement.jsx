import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGet from '../CustomHooks/useGet'
import useGetTutors from "../CustomHooks/useGetTutors"
import { FiUser, FiMail, FiPhone, FiBook, FiMapPin, FiClock, FiUpload, FiX, FiDownload, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi'
import Papa from 'papaparse'
import { toast } from 'react-hot-toast'
import { useCenterRefetch } from '../../context/CenterRefetchContext'

const TutorManagement = () => {
  const [editingTutor, setEditingTutor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('')
  const [error, setError] = useState(null);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
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
    sessionTiming: '',
    assignedHadiyaAmount: '',
    aadharNumber: '',
    aadharPhoto: null,
    bankAccountNumber: '',
    ifscCode: '',
    passbookPhoto: null,
    certificates: [],
    memos: [],
    resume: null
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

  const refetchCenterContext = useCenterRefetch();

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
      sessionTiming: tutor.sessionTiming,
      assignedHadiyaAmount: tutor.assignedHadiyaAmount || '', // Or || 0
      aadharNumber: tutor.documents?.aadharNumber || '',
      aadharPhoto: tutor.documents?.aadharPhoto || null,
      bankAccountNumber: tutor.documents?.bankAccount?.accountNumber || '',
      ifscCode: tutor.documents?.bankAccount?.ifscCode || '',
      passbookPhoto: tutor.documents?.passbookPhoto || null,
      certificates: tutor.documents?.certificates || [],
      memos: tutor.documents?.memos || [],
      resume: tutor.documents?.resume || null
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
      password: '',
      assignmentInfo: '',
      assignedCenter: '',
      subjects: [],
      sessionType: '',
      sessionTiming: '',
      assignedHadiyaAmount: '',
      aadharNumber: '',
      aadharPhoto: null,
      bankAccountNumber: '',
      ifscCode: '',
      passbookPhoto: null,
      certificates: [],
      memos: [],
      resume: null
    });
  };

  const confirmClose = () => {
    setShowForm(false);
    setShowConfirmClose(false);
    setEditingTutor(null);
    resetForm();
  };

<<<<<<< HEAD
  const validateFields = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required.';
    if (!formData.email.trim()) errors.email = 'Email is required.';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email)) errors.email = 'Invalid email address.';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required.';
    else if (!/^\d{10}$/.test(formData.phone)) errors.phone = 'Phone must be 10 digits.';
    if (!formData.password || (formData.password !== 'tutor@123' && formData.password.length < 6)) errors.password = 'Password must be at least 6 characters.';
    if (!formData.assignedCenter) errors.assignedCenter = 'Please select a center.';
    if (!formData.subjects || formData.subjects.length === 0) errors.subjects = 'Select at least one subject.';
    if (!formData.sessionType) errors.sessionType = 'Select session type.';
    if (!formData.sessionTiming) errors.sessionTiming = 'Select session timing.';
    return errors;
=======
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'certificates' || name === 'memos') {
      setFormData(prev => ({ ...prev, [name]: Array.from(files) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
>>>>>>> 9085f8deb4217554e61cd8e0e3f767aa7fed09f6
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShowErrorAlert(false);
    setIsSubmitting(true);

<<<<<<< HEAD
    const errors = validateFields();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError('Please fix the errors below.');
=======
    // Validate required fields (certificates and memos now optional)
    if (!formData.name || !formData.email || !formData.phone || !formData.assignedCenter || !formData.subjects?.length || !formData.sessionType || !formData.sessionTiming || !formData.aadharNumber || !formData.aadharPhoto || !formData.bankAccountNumber || !formData.ifscCode || !formData.passbookPhoto || !formData.resume) {
      setError('Please fill in all required fields, including all mandatory documents.');
>>>>>>> 9085f8deb4217554e61cd8e0e3f767aa7fed09f6
      setShowErrorAlert(true);
      setIsSubmitting(false);
      return;
    }

<<<<<<< HEAD
    // Get the selected center
    const selectedCenter = centers?.find(c => c._id === formData.assignedCenter);
    if (!selectedCenter) {
      setFieldErrors(prev => ({ ...prev, assignedCenter: 'Please select a valid center.' }));
      setError('Please select a valid center');
      setShowErrorAlert(true);
      setIsSubmitting(false);
      return;
    }

    // --- Build FormData for multipart/form-data ---
    const formPayload = new FormData();
    formPayload.append('name', formData.name.trim());
    formPayload.append('email', formData.email.trim());
    formPayload.append('phone', formData.phone.trim());
    formPayload.append('assignedCenter', selectedCenter._id);
    formPayload.append('sessionType', formData.sessionType);
    formPayload.append('sessionTiming', formData.sessionTiming);
    formPayload.append('assignmentInformation', formData.assignmentInfo || '');
    formPayload.append('assignedHadiyaAmount', formData.assignedHadiyaAmount ? parseFloat(formData.assignedHadiyaAmount) : 0);
    if (formData.password && formData.password !== 'tutor@123') {
      formPayload.append('password', formData.password);
    }
    // Subjects as array
    if (Array.isArray(formData.subjects)) {
      formData.subjects.forEach((s, i) => formPayload.append(`subjects[${i}]`, s));
    }
    // Documents
    if (formData.aadharNumber) formPayload.append('aadharNumber', formData.aadharNumber);
    if (formData.aadharPhoto) formPayload.append('aadharPhoto', formData.aadharPhoto);
    if (formData.bankAccountNumber) formPayload.append('bankAccountNumber', formData.bankAccountNumber);
    if (formData.ifscCode) formPayload.append('ifscCode', formData.ifscCode);
    if (formData.passbookPhoto) formPayload.append('passbookPhoto', formData.passbookPhoto);
    // Certificates (multiple)
    if (formData.certificates && formData.certificates.length > 0) {
      Array.from(formData.certificates).forEach((file, i) => formPayload.append('certificates', file));
    }
    // Memos (multiple)
    if (formData.memos && formData.memos.length > 0) {
      Array.from(formData.memos).forEach((file, i) => formPayload.append('memos', file));
    }
    // Resume (single)
    if (formData.resume) formPayload.append('resume', formData.resume);

    // Check if all required information is complete
    const isInformationComplete = Boolean(
      formData.name &&
      formData.email &&
      formData.phone &&
      formData.assignedCenter &&
      formData.subjects &&
      formData.subjects.length > 0 &&
      formData.sessionType &&
      formData.sessionTiming
    );

    // Show status based on information completeness
    if (isInformationComplete) {
      setEditingTutor({ ...editingTutor, status: 'active' });
      setFormData({ ...formData, status: 'active' });
    } else {
      setEditingTutor({ ...editingTutor, status: 'pending' });
      setFormData({ ...formData, status: 'pending' });
    }

    const userDataString = localStorage.getItem('userData');
    const token = userDataString ? JSON.parse(userDataString).token : null;
    if (!token) {
      setError('Please login to continue');
      setShowErrorAlert(true);
      setIsSubmitting(false);
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/admin';
      }, 2000);
      return;
    }

    const url = editingTutor 
      ? `http://localhost:5000/api/tutors/${editingTutor._id}`
      : 'http://localhost:5000/api/tutors';

    try {
      const response = await fetch(url, {
        method: editingTutor ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 'Content-Type': 'multipart/form-data', // DO NOT SET THIS! Let browser set it
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: formPayload
      });

=======
    try {
      const userDataString = localStorage.getItem('userData');
      const token = userDataString ? JSON.parse(userDataString).token : null;
      if (!token) {
        setError('Please login to continue');
        setShowErrorAlert(true);
        setIsSubmitting(false);
        setTimeout(() => { window.location.href = '/admin'; }, 2000);
        return;
      }

      const form = new FormData();
      form.append('name', formData.name);
      form.append('email', formData.email);
      form.append('phone', formData.phone);
      form.append('password', formData.password);
      form.append('assignmentInfo', formData.assignmentInfo);
      form.append('assignedCenter', formData.assignedCenter);
      formData.subjects.forEach(subj => form.append('subjects', subj));
      form.append('sessionType', formData.sessionType);
      form.append('sessionTiming', formData.sessionTiming);
      form.append('assignedHadiyaAmount', formData.assignedHadiyaAmount);
      form.append('documents[aadharNumber]', formData.aadharNumber);
      form.append('aadharPhoto', formData.aadharPhoto);
      form.append('documents[bankAccount][accountNumber]', formData.bankAccountNumber);
      form.append('documents[bankAccount][ifscCode]', formData.ifscCode);
      form.append('passbookPhoto', formData.passbookPhoto);
      formData.certificates.forEach(file => form.append('certificates', file));
      formData.memos.forEach(file => form.append('memos', file));
      form.append('resume', formData.resume);

      const url = editingTutor 
        ? `http://localhost:5000/api/tutors/${editingTutor._id}`
        : 'http://localhost:5000/api/tutors';

      const response = await fetch(url, {
        method: editingTutor ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: form
      });
>>>>>>> 9085f8deb4217554e61cd8e0e3f767aa7fed09f6
      const data = await response.json();

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 401) {
          setError('Your session has expired. Please login again.');
          setShowErrorAlert(true);
          setIsSubmitting(false);
          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = '/admin';
          }, 2000);
          return;
        }

        if (response.status === 400) {
          if (data.message) {
            setError(data.message);
          } else if (data.errors && data.errors.length > 0) {
            setError(data.errors.map(error => error.msg).join(', '));
          } else {
            setError('Failed to update tutor. Please check your input and try again.');
          }
          setShowErrorAlert(true);
          setIsSubmitting(false);
          return;
        }

        if (data.message?.includes('already exists')) {
          setError('A tutor with this phone number already exists. Please use a different phone number.');
          setShowErrorAlert(true);
          setShowForm(false);
          setIsSubmitting(false);
          return;
        }

        // Default error message for other cases
        setError('Failed to update tutor. Please check your input and try again.');
        setShowErrorAlert(true);
        setIsSubmitting(false);
        return;
      }

      // Success case
      setShowForm(false);
      setEditingTutor(null);
      resetForm();
      // Refresh tutors list
      setRefreshKey(prev => prev + 1);
      toast.success('Tutor updated successfully');
    } catch (error) {
      console.error('Error updating tutor:', error);
      setError('An error occurred. Please check your internet connection and try again.');
      setShowErrorAlert(true);
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
      const userDataString = localStorage.getItem('userData');
      const token = userDataString ? JSON.parse(userDataString).token : null;
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
      // Trigger center refetch for instant update
      if (refetchCenterContext && refetchCenterContext.current) {
        refetchCenterContext.current();
      }
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
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex justify-between items-start p-6 border-b">
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

        <div className="overflow-y-auto p-6 space-y-6">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-xl font-medium">
              {tutor.name.charAt(0)}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-bold text-gray-900">{tutor.name}</h3>
              <p className="text-sm text-gray-500">{tutor.qualifications || 'Qualifications pending'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{tutor.email}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{tutor.phone}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Center</p>
              <p className="font-medium">{getCenterName(tutor)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Join Date</p>
              <p className="font-medium">{new Date(tutor.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Session Type</p>
              <p className="font-medium capitalize">{tutor.sessionType}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Session Timing</p>
              <p className="font-medium capitalize">{tutor.sessionTiming?.replace(/_/g, ' ')}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Documents</h4>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Aadhar Number:</span> {tutor.documents?.aadharNumber || <span className="text-gray-400">Not Provided</span>}</div>
              <div><span className="font-medium">Aadhar Photo:</span> {tutor.documents?.aadharPhoto ? (<a href={`/${tutor.documents.aadharPhoto}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>) : <span className="text-gray-400">Not Provided</span>}</div>
              <div><span className="font-medium">Bank Account Number:</span> {tutor.documents?.bankAccount?.accountNumber || <span className="text-gray-400">Not Provided</span>}</div>
              <div><span className="font-medium">IFSC Code:</span> {tutor.documents?.bankAccount?.ifscCode || <span className="text-gray-400">Not Provided</span>}</div>
              <div><span className="font-medium">Passbook Photo:</span> {tutor.documents?.bankAccount?.passbookPhoto ? (<a href={`/${tutor.documents.bankAccount.passbookPhoto}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>) : <span className="text-gray-400">Not Provided</span>}</div>
              <div><span className="font-medium">Certificates:</span> {Array.isArray(tutor.documents?.certificates) && tutor.documents.certificates.length > 0 ? tutor.documents.certificates.map((file, idx) => (<a key={idx} href={`/${file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">View {idx + 1}</a>)) : <span className="text-gray-400">Not Provided</span>}</div>
              <div><span className="font-medium">Memos:</span> {Array.isArray(tutor.documents?.memos) && tutor.documents.memos.length > 0 ? tutor.documents.memos.map((file, idx) => (<a key={idx} href={`/${file}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline mr-2">View {idx + 1}</a>)) : <span className="text-gray-400">Not Provided</span>}</div>
              <div><span className="font-medium">Resume:</span> {tutor.documents?.resume ? (<a href={`/${tutor.documents.resume}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View</a>) : <span className="text-gray-400">Not Provided</span>}</div>
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
    <div className="p-6 space-y-6">
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
          <div className="flex-1 min-w-[200px]">
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
          <div className="w-64 min-w-[200px]">
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

        <div className="w-full">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center & Subjects
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Session
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedTutors.map((tutor) => (
                <tr
                  key={tutor._id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => !isLoading && setShowProfile(tutor)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-medium">
                        {tutor.name.charAt(0)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
                        <div className="text-xs text-gray-500">{tutor.qualifications || 'Qualifications pending'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{tutor.email}</div>
                    <div className="text-xs text-gray-500">{tutor.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{getCenterName(tutor)}</div>
                    <div className="text-xs text-gray-500">
                      {tutor.subjects?.slice(0, 2).join(', ')}
                      {tutor.subjects?.length > 2 ? ` +${tutor.subjects.length - 2} more` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{tutor.sessionType}</div>
                    <div className="text-xs text-gray-500 capitalize">{tutor.sessionTiming?.replace(/_/g, ' ')}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      tutor.status === 'active' ? 'bg-green-100 text-green-800' : 
                      tutor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {tutor.status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
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
              ))}
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

              <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
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
                      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
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
                      {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
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
                        maxLength={10}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                      {fieldErrors.phone && <p className="text-red-500 text-xs mt-1">{fieldErrors.phone}</p>}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">10-digit mobile number</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                      {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
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

                <div> { /* New Hadiya Amount Field Start */ }
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Monthly Hadiya (₹)
                  </label>
                  <div className="relative">
                    {/* Optional: Icon for currency if you have one, e.g., <FiDollarSign /> */}
                    <input
                      type="number"
                      name="assignedHadiyaAmount"
                      value={formData.assignedHadiyaAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, assignedHadiyaAmount: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="e.g., 15000"
                      min="0" // Optional: prevent negative numbers
                    />
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Enter the agreed monthly payment amount.</p>
                </div> { /* New Hadiya Amount Field End */ }

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
                      {fieldErrors.assignedCenter && <p className="text-red-500 text-xs mt-1">{fieldErrors.assignedCenter}</p>}
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
                    {fieldErrors.subjects && <p className="text-red-500 text-xs mt-1">{fieldErrors.subjects}</p>}
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
                      {fieldErrors.sessionType && <p className="text-red-500 text-xs mt-1">{fieldErrors.sessionType}</p>}
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
                        {fieldErrors.sessionTiming && <p className="text-red-500 text-xs mt-1">{fieldErrors.sessionTiming}</p>}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number <span className="text-red-500">*</span></label>
                    <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={e => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Photo <span className="text-red-500">*</span></label>
                    <input type="file" name="aadharPhoto" accept="image/*" onChange={handleFileChange} className="w-full" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number <span className="text-red-500">*</span></label>
                    <input type="text" name="bankAccountNumber" value={formData.bankAccountNumber} onChange={e => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code <span className="text-red-500">*</span></label>
                    <input type="text" name="ifscCode" value={formData.ifscCode} onChange={e => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))} className="w-full px-4 py-2 border border-gray-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Passbook Photo <span className="text-red-500">*</span></label>
                    <input type="file" name="passbookPhoto" accept="image/*" onChange={handleFileChange} className="w-full" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificates <span className="text-red-500">*</span> (multiple allowed)</label>
                    <input type="file" name="certificates" accept="image/*,application/pdf" multiple onChange={handleFileChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memos <span className="text-red-500">*</span> (multiple allowed)</label>
                    <input type="file" name="memos" accept="image/*,application/pdf" multiple onChange={handleFileChange} className="w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resume <span className="text-red-500">*</span></label>
                    <input type="file" name="resume" accept="application/pdf,.doc,.docx" onChange={handleFileChange} className="w-full" required />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    Reset
                  </button>
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
                {/* --- DOCUMENTS SECTION --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                    <input
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber || ''}
                      onChange={e => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter Aadhar Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Photo (JPG/PNG/PDF)</label>
                    <input
                      type="file"
                      name="aadharPhoto"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => setFormData(prev => ({ ...prev, aadharPhoto: e.target.files[0] }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    {formData.aadharPhoto && <p className="text-xs text-gray-600 mt-1">Selected: {formData.aadharPhoto.name}</p>}
                  </div>

                  {/* Bank Account Details */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      name="bankAccountNumber"
                      value={formData.bankAccountNumber || ''}
                      onChange={e => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter Account Number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      name="ifscCode"
                      value={formData.ifscCode || ''}
                      onChange={e => setFormData(prev => ({ ...prev, ifscCode: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter IFSC Code"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bank Passbook Photo (JPG/PNG/PDF)</label>
                    <input
                      type="file"
                      name="passbookPhoto"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => setFormData(prev => ({ ...prev, passbookPhoto: e.target.files[0] }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    {formData.passbookPhoto && <p className="text-xs text-gray-600 mt-1">Selected: {formData.passbookPhoto.name}</p>}
                  </div>
                </div>

                {/* Certificates, Memos, Resume */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificates (PDF, multiple allowed)</label>
                    <input
                      type="file"
                      name="certificates"
                      accept=".jpg,.jpeg,.png,.pdf"
                      multiple
                      onChange={e => setFormData(prev => ({ ...prev, certificates: e.target.files }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    {formData.certificates && formData.certificates.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        Selected: {[...formData.certificates].map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Memos (PDF, multiple allowed)</label>
                    <input
                      type="file"
                      name="memos"
                      accept=".jpg,.jpeg,.png,.pdf"
                      multiple
                      onChange={e => setFormData(prev => ({ ...prev, memos: e.target.files }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    {formData.memos && formData.memos.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        Selected: {[...formData.memos].map(f => f.name).join(', ')}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Resume (PDF)</label>
                    <input
                      type="file"
                      name="resume"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={e => setFormData(prev => ({ ...prev, resume: e.target.files[0] }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                    {formData.resume && <p className="text-xs text-gray-600 mt-1">Selected: {formData.resume.name}</p>}
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleFormClose}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
                    disabled={isSubmitting}
                  >
                    {editingTutor ? 'Update Tutor' : 'Add Tutor'}
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

