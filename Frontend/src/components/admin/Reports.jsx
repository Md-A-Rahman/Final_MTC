import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiDownload, FiCalendar, FiFilter, FiCheck, FiX } from 'react-icons/fi'
import DatePicker from 'react-datepicker'
import "react-datepicker/dist/react-datepicker.css"
import { format, isToday, isSunday, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import Papa from 'papaparse'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const Reports = () => {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCenter, setSelectedCenter] = useState('')
  const [showAttendanceForm, setShowAttendanceForm] = useState(false)

  // Sample data - replace with actual data from backend
  const centers = [
    { id: 1, name: 'Malakpet Center' },
    { id: 2, name: 'Mehdipatnam Center' },
  ]

  const tutors = [
    {
      id: 1,
      name: 'Ahmed Khan',
      center: 'Malakpet Center',
      attendance: {
        '2023-12-01': true,
        '2023-12-02': true,
        '2023-12-03': false, // Sunday
        '2023-12-04': true,
        '2023-12-05': false,
      }
    },
    // Add more sample tutors...
  ]

  const handleExportCSV = () => {
    const monthDays = eachDayOfInterval({
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate)
    })

    const data = tutors.map(tutor => {
      const attendanceData = {
        'Tutor Name': tutor.name,
        'Center': tutor.center,
        'Present Days': Object.values(tutor.attendance).filter(Boolean).length,
        'Absent Days': Object.values(tutor.attendance).filter(day => !day).length,
      }

      // Add attendance for each day
      monthDays.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        attendanceData[format(day, 'dd MMM')] = tutor.attendance[dateStr] ? 'Present' : 'Absent'
      })

      return attendanceData
    })

    const csv = Papa.unparse(data)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `attendance_report_${format(selectedDate, 'MMM_yyyy')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    
    // Title
    doc.setFontSize(16)
    doc.text('Monthly Attendance Report', 14, 15)
    doc.setFontSize(12)
    doc.text(`Month: ${format(selectedDate, 'MMMM yyyy')}`, 14, 25)

    // Create table data
    const tableData = tutors.map(tutor => [
      tutor.name,
      tutor.center,
      Object.values(tutor.attendance).filter(Boolean).length,
      Object.values(tutor.attendance).filter(day => !day).length,
      `${(Object.values(tutor.attendance).filter(Boolean).length / Object.values(tutor.attendance).length * 100).toFixed(1)}%`
    ])

    doc.autoTable({
      startY: 35,
      head: [['Tutor Name', 'Center', 'Present Days', 'Absent Days', 'Attendance %']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    })

    doc.save(`attendance_report_${format(selectedDate, 'MMM_yyyy')}.pdf`)
  }

  const handleMarkAttendance = (tutorId, date, status) => {
    // Here you would update the attendance in your backend
    console.log('Marking attendance:', { tutorId, date, status })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Attendance Reports
        </h1>
        <div className="flex gap-4">
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
          {isToday(selectedDate) && (
            <button
              onClick={() => setShowAttendanceForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Mark Today's Attendance
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <DatePicker
                selected={selectedDate}
                onChange={date => setSelectedDate(date)}
                dateFormat="MMMM yyyy"
                showMonthYearPicker
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="w-64">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Center
            </label>
            <div className="relative">
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={selectedCenter}
                onChange={(e) => setSelectedCenter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="">All Centers</option>
                {centers.map(center => (
                  <option key={center.id} value={center.name}>
                    {center.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Monthly Attendance Table */}
        <div className="overflow-x-auto mt-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Center
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tutors
                .filter(tutor => !selectedCenter || tutor.center === selectedCenter)
                .map((tutor) => {
                  const presentDays = Object.values(tutor.attendance).filter(Boolean).length
                  const totalDays = Object.values(tutor.attendance).length
                  const attendancePercentage = (presentDays / totalDays) * 100

                  return (
                    <tr key={tutor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{tutor.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tutor.center}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{presentDays}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{totalDays - presentDays}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          attendancePercentage >= 90 ? 'text-green-600' :
                          attendancePercentage >= 75 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {attendancePercentage.toFixed(1)}%
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Attendance Modal */}
      {showAttendanceForm && (
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
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-4xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Mark Today's Attendance
              </h2>
              <button
                onClick={() => setShowAttendanceForm(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {tutors.map((tutor) => (
                <div
                  key={tutor.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{tutor.name}</p>
                    <p className="text-sm text-gray-500">{tutor.center}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkAttendance(tutor.id, selectedDate, true)}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center"
                    >
                      <FiCheck className="mr-2" /> Present
                    </button>
                    <button
                      onClick={() => handleMarkAttendance(tutor.id, selectedDate, false)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center"
                    >
                      <FiX className="mr-2" /> Absent
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAttendanceForm(false)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Reports