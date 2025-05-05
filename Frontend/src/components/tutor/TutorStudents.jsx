import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import DatePicker from 'react-datepicker'
import { FiSearch, FiEdit2, FiTrash2, FiDownload, FiUserPlus, FiFilter, FiX, FiCheck, FiCalendar } from 'react-icons/fi'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import useGet from '../CustomHooks/useGet'
import { toast } from 'react-hot-toast'
import "react-datepicker/dist/react-datepicker.css"
import { useCenterRefetch } from '../../context/CenterRefetchContext'

const TutorStudents = () => {
  const [showForm, setShowForm] = useState(false)
  const [showDetails, setShowDetails] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [attendanceData, setAttendanceData] = useState({
    month: new Date(),
    presentDays: '',
    totalDays: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const itemsPerPage = 10
  const [selectedClass, setSelectedClass] = useState('all')
  const [editMode, setEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Get tutor data from localStorage
  const tutorData = JSON.parse(localStorage.getItem('user') || '{}')

  // Fetch students data
  const { response: students, loading, error, refetch } = useGet('/students')

  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    contact: '',
    isOrphan: false,
    guardianName: '',
    guardianContact: '',
    isNonSchoolGoing: false,
    schoolName: '',
    class: '',
    gender: '',
    medium: '',
    aadharNumber: '',
    remarks: '',
    assignedTutor: tutorData._id // Assign the current tutor
  })

  const refetchCenterContext = useCenterRefetch()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please login to continue')
      }

      // Get tutor data from localStorage
      const tutorData = JSON.parse(localStorage.getItem('user') || '{}')
      if (!tutorData.assignedCenter) {
        throw new Error('Tutor center information not found')
      }

      // Format the data according to backend requirements
      const formattedData = {
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim(),
        contact: formData.contact.trim(),
        isOrphan: formData.isOrphan,
        isNonSchoolGoing: formData.isNonSchoolGoing,
        gender: formData.gender,
        medium: formData.medium,
        aadharNumber: formData.aadharNumber.trim(),
        assignedCenter: tutorData.assignedCenter && tutorData.assignedCenter._id ? tutorData.assignedCenter._id : tutorData.assignedCenter,
        assignedTutor: tutorData._id,
        remarks: formData.remarks.trim()
      };

      // Only add guardianInfo if isOrphan is true
      if (formData.isOrphan) {
        formattedData.guardianInfo = {
          name: formData.guardianName.trim(),
          contact: formData.guardianContact.trim()
        };
      }

      // Only add schoolInfo if isNonSchoolGoing is false
      if (!formData.isNonSchoolGoing) {
        formattedData.schoolInfo = {
          name: formData.schoolName.trim(),
          class: formData.class.trim()
        };
      }

      console.log('Sending student data:', formattedData) // Debug log

      const response = await fetch('http://localhost:5000/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formattedData)
      })

      const responseData = await response.json()

      if (!response.ok) {
        console.error('Backend error:', responseData);
        throw new Error(responseData.message || JSON.stringify(responseData) || 'Failed to add student')
      }

      toast.success('Student added successfully!')
      setShowForm(false)
      setFormData({
        name: '',
        fatherName: '',
        contact: '',
        isOrphan: false,
        guardianName: '',
        guardianContact: '',
        isNonSchoolGoing: false,
        schoolName: '',
        class: '',
        gender: '',
        medium: '',
        aadharNumber: '',
        remarks: '',
        assignedTutor: tutorData._id
      })
      refetch() // Refresh the students list
      // Trigger center refetch for instant update
      if (refetchCenterContext && refetchCenterContext.current) {
        refetchCenterContext.current();
      }
    } catch (error) {
      console.error('Error adding student:', error) // Debug log
      toast.error(error.message || 'Failed to add student')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('Please login to continue')
        }

        const response = await fetch(`http://localhost:5000/api/students/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Failed to delete student')
        }

        toast.success('Student deleted successfully!')
        refetch() // Refresh the students list
        // Trigger center refetch for instant update
        if (refetchCenterContext && refetchCenterContext.current) {
          refetchCenterContext.current();
        }
      } catch (error) {
        toast.error(error.message || 'Failed to delete student')
      }
    }
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text('Students Report', 14, 15)
    doc.setFontSize(12)
    doc.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy')}`, 14, 25)

    const tableData = students.map(student => [
      student.name,
      student.fatherName,
      student.class,
      student.schoolName,
      format(new Date(student.joiningDate), 'dd/MM/yyyy')
    ])

    doc.autoTable({
      startY: 35,
      head: [['Name', 'Father\'s Name', 'Class', 'School', 'Joining Date']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 }
    })

    doc.save('students_report.pdf')
  }

  const handleExportCSV = () => {
    const data = students.map(student => ({
      'Name': student.name,
      'Father\'s Name': student.fatherName,
      'Contact': student.contact,
      'Class': student.class,
      'School': student.schoolName,
      'Gender': student.gender,
      'Medium': student.medium,
      'Joining Date': student.joiningDate
    }))

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'students_data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleMarkAttendance = (student) => {
    setSelectedStudent(student)
    setShowAttendanceModal(true)
  }

  const handleAttendanceSubmit = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Please login to continue')
      }

      const response = await fetch(`http://localhost:5000/api/students/${selectedStudent._id}/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: format(attendanceData.month, 'yyyy-MM'),
          presentDays: parseInt(attendanceData.presentDays),
          totalDays: parseInt(attendanceData.totalDays)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to mark attendance')
      }

      toast.success('Attendance marked successfully!')
      setShowAttendanceModal(false)
      setAttendanceData({
        month: new Date(),
        presentDays: '',
        totalDays: ''
      })
      refetch() // Refresh the students list
    } catch (error) {
      toast.error(error.message || 'Failed to mark attendance')
    }
  }

  // Filter and paginate students
  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.fatherName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesClass = selectedClass === 'all' || student.class === selectedClass || (student.schoolInfo && student.schoolInfo.class === selectedClass)
    return matchesSearch && matchesClass
  }) || []

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage)

  // Edit student handler
  const handleEditStudent = (student) => {
    setEditFormData({
      name: student.name || '',
      fatherName: student.fatherName || '',
      contact: student.contact || '',
      isOrphan: student.isOrphan || false,
      guardianName: (student.guardianInfo && student.guardianInfo.name) || '',
      guardianContact: (student.guardianInfo && student.guardianInfo.contact) || '',
      isNonSchoolGoing: student.isNonSchoolGoing || false,
      schoolName: (student.schoolInfo && student.schoolInfo.name) || '',
      class: (student.schoolInfo && student.schoolInfo.class) || '',
      gender: student.gender || '',
      medium: student.medium || '',
      aadharNumber: student.aadharNumber || '',
      remarks: student.remarks || '',
      _id: student._id
    })
    setEditMode(true)
  }

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Please login to continue')
      const tutorData = JSON.parse(localStorage.getItem('user') || '{}')
      const updatedData = {
        name: editFormData.name,
        fatherName: editFormData.fatherName,
        contact: editFormData.contact,
        isOrphan: editFormData.isOrphan,
        guardianInfo: editFormData.isOrphan ? {
          name: editFormData.guardianName,
          contact: editFormData.guardianContact
        } : {},
        isNonSchoolGoing: editFormData.isNonSchoolGoing,
        schoolInfo: !editFormData.isNonSchoolGoing ? {
          name: editFormData.schoolName,
          class: editFormData.class
        } : {},
        gender: editFormData.gender,
        medium: editFormData.medium,
        aadharNumber: editFormData.aadharNumber,
        assignedCenter: tutorData.assignedCenter && tutorData.assignedCenter._id ? tutorData.assignedCenter._id : tutorData.assignedCenter,
        assignedTutor: tutorData._id,
        remarks: editFormData.remarks
      }
      const response = await fetch(`http://localhost:5000/api/students/${editFormData._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update student')
      }
      toast.success('Student updated successfully!')
      setEditMode(false)
      setShowDetails(null)
      refetch()
    } catch (error) {
      toast.error(error.message || 'Failed to update student')
    }
  }

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) return
    setIsDeleting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Please login to continue')
      const response = await fetch(`http://localhost:5000/api/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete student')
      }
      toast.success('Student deleted successfully!')
      setShowDetails(null)
      refetch()
      // Trigger center refetch for instant update
      if (refetchCenterContext && refetchCenterContext.current) {
        refetchCenterContext.current();
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete student')
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent-600"></div>
      </div>
    )
  }

  if (error) {
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
              {error.includes('login') ? (
                <>
                  Please <a href="/login" className="text-blue-600 hover:text-blue-500">login</a> to view students
                </>
              ) : (
                error
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
          Students Management
        </h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            <FiUserPlus className="mr-2" /> Add Student
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            <FiDownload className="mr-2" /> Export PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            <FiDownload className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              />
            </div>
          </div>
          <div className="w-64">
            <div className="relative">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 appearance-none"
              >
                <option value="all">All Classes</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={`${i + 1}th`}>{i + 1}th</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Father's Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStudents.map((student) => (
                <tr
                  key={student._id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setShowDetails(student)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.fatherName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.schoolInfo?.class || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.schoolInfo?.name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-3" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMarkAttendance(student)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FiCalendar size={18} />
                      </button>
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student._id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
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

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-700">
              Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
              </span>{' '}
              of <span className="font-medium">{filteredStudents.length}</span> results
            </span>
          </div>
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md ${
                  currentPage === page
                    ? 'bg-accent-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Student Form Modal */}
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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                  Add New Student
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Student Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      pattern="[0-9]{10}"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isOrphan"
                        checked={formData.isOrphan}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Orphan</span>
                    </label>
                  </div>

                  {formData.isOrphan && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guardian Name
                        </label>
                        <input
                          type="text"
                          name="guardianName"
                          value={formData.guardianName}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guardian Contact
                        </label>
                        <input
                          type="tel"
                          name="guardianContact"
                          value={formData.guardianContact}
                          onChange={handleChange}
                          pattern="[0-9]{10}"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="isNonSchoolGoing"
                        checked={formData.isNonSchoolGoing}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-accent-600 focus:ring-accent-500"
                      />
                      <span className="text-sm font-medium text-gray-700">Non-School Going</span>
                    </label>
                  </div>

                  {!formData.isNonSchoolGoing && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          School Name
                        </label>
                        <input
                          type="text"
                          name="schoolName"
                          value={formData.schoolName}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Class
                        </label>
                        <select
                          name="class"
                          value={formData.class}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                          required
                        >
                          <option value="">Select Class</option>
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i + 1} value={`${i + 1}th`}>
                              {i + 1}th
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Medium
                    </label>
                    <select
                      name="medium"
                      value={formData.medium}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    >
                      <option value="">Select Medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleChange}
                      pattern="[0-9]{4} [0-9]{4} [0-9]{4}"
                      placeholder="1234 5678 9012"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  ></textarea>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-accent-600 to-primary-600 text-white rounded-lg hover:from-accent-700 hover:to-primary-700 transition-all duration-300"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Details Modal */}
      <AnimatePresence>
        {showDetails && !editMode && (
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
                <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                  Student Details
                </h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{showDetails.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Father's Name</p>
                  <p className="font-medium">{showDetails.fatherName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{showDetails.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class</p>
                  <p className="font-medium">{showDetails.schoolInfo?.class || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">School</p>
                  <p className="font-medium">{showDetails.schoolInfo?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium">{showDetails.gender}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Medium</p>
                  <p className="font-medium">{showDetails.medium}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Aadhar Number</p>
                  <p className="font-medium">{showDetails.aadharNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Joining Date</p>
                  <p className="font-medium">{showDetails.joiningDate ? format(new Date(showDetails.joiningDate), 'dd/MM/yyyy') : ''}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assigned Tutor</p>
                  <p className="font-medium">{showDetails.assignedTutor && showDetails.assignedTutor.name ? showDetails.assignedTutor.name : showDetails.assignedTutor}</p>
                </div>
              </div>
              <div className="mt-6">
                <p className="text-sm text-gray-500">Remarks</p>
                <p className="font-medium">{showDetails.remarks}</p>
              </div>
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Attendance History</h3>
                <div className="space-y-2">
                  {showDetails.attendance && Object.entries(showDetails.attendance).map(([month, data]) => (
                    <div key={month} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                      <span className="font-medium">{format(new Date(month), 'MMMM yyyy')}</span>
                      <span className={`font-medium ${
                        (data.presentDays / data.totalDays) * 100 >= 75
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {data.presentDays}/{data.totalDays} days
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end mt-6 space-x-4">
                <button
                  onClick={() => handleEditStudent(showDetails)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteStudent(showDetails._id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDetails(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editMode && editFormData && (
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent">
                  Edit Student
                </h2>
                <button
                  onClick={() => setEditMode(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                    <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Father's Name</label>
                    <input type="text" name="fatherName" value={editFormData.fatherName} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input type="tel" name="contact" value={editFormData.contact} onChange={handleEditChange} pattern="[0-9]{10}" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="isOrphan" checked={editFormData.isOrphan} onChange={handleEditChange} className="rounded border-gray-300 text-accent-600 focus:ring-accent-500" />
                      <span className="text-sm font-medium text-gray-700">Orphan</span>
                    </label>
                  </div>
                  {editFormData.isOrphan && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Name</label>
                        <input type="text" name="guardianName" value={editFormData.guardianName} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Contact</label>
                        <input type="tel" name="guardianContact" value={editFormData.guardianContact} onChange={handleEditChange} pattern="[0-9]{10}" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" name="isNonSchoolGoing" checked={editFormData.isNonSchoolGoing} onChange={handleEditChange} className="rounded border-gray-300 text-accent-600 focus:ring-accent-500" />
                      <span className="text-sm font-medium text-gray-700">Non-School Going</span>
                    </label>
                  </div>
                  {!editFormData.isNonSchoolGoing && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                        <input type="text" name="schoolName" value={editFormData.schoolName} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                        <select name="class" value={editFormData.class} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required >
                          <option value="">Select Class</option>
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i + 1} value={`${i + 1}th`}>{i + 1}th</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select name="gender" value={editFormData.gender} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medium</label>
                    <select name="medium" value={editFormData.medium} onChange={handleEditChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required >
                      <option value="">Select Medium</option>
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                      <option value="Urdu">Urdu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                    <input type="text" name="aadharNumber" value={editFormData.aadharNumber} onChange={handleEditChange} pattern="[0-9]{4} [0-9]{4} [0-9]{4}" placeholder="1234 5678 9012" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea name="remarks" value={editFormData.remarks} onChange={handleEditChange} rows="3" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"></textarea>
                </div>
                <div className="flex justify-end space-x-4">
                  <button type="button" onClick={() => setEditMode(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-gradient-to-r from-accent-600 to-primary-600 text-white rounded-lg hover:from-accent-700 hover:to-primary-700 transition-all duration-300">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark Attendance Modal */}
      <AnimatePresence>
        {showAttendanceModal && selectedStudent && (
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
              className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
            >
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Mark Monthly Attendance - {selectedStudent.name}
                </h3>
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <FiX size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Month
                  </label>
                  <DatePicker
                    selected={attendanceData.month}
                    onChange={(date) => setAttendanceData(prev => ({ ...prev, month: date }))}
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Present Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={attendanceData.presentDays}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, presentDays: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Days
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="31"
                    value={attendanceData.totalDays}
                    onChange={(e) => setAttendanceData(prev => ({ ...prev, totalDays: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAttendanceSubmit}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  Save Attendance
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TutorStudents