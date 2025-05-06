import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCenter, setSelectedCenter] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  const [centers, setCenters] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchCenters();
    fetchTutors();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/students', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setStudents(data);
      setFilteredStudents(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch students');
      setLoading(false);
    }
  };

  const fetchCenters = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/centers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setCenters(data);
    } catch (err) {
      console.error('Failed to fetch centers');
    }
  };

  const fetchTutors = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/tutors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTutors(data);
    } catch (err) {
      console.error('Failed to fetch tutors');
    }
  };

  useEffect(() => {
    let filtered = [...students];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(student => {
        // Search in student name
        if (student.name?.toLowerCase().includes(query)) return true;
        
        // Search in center name and area
        if (student.assignedCenter) {
          if (student.assignedCenter.name?.toLowerCase().includes(query)) return true;
          if (student.assignedCenter.area?.toLowerCase().includes(query)) return true;
        }
        
        // Search in tutor name
        if (student.assignedTutor?.name?.toLowerCase().includes(query)) return true;
        
        return false;
      });
    }

    // Apply center filter
    if (selectedCenter) {
      filtered = filtered.filter(student => student.assignedCenter?._id === selectedCenter);
    }

    // Apply tutor filter
    if (selectedTutor) {
      filtered = filtered.filter(student => student.assignedTutor?._id === selectedTutor);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, selectedCenter, selectedTutor, students]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCenter('');
    setSelectedTutor('');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading students...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">Students</h1>
        
        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, center, or tutor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Center Filter */}
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Centers</option>
              {centers.map(center => (
                <option key={center._id} value={center._id}>
                  {center.name}
                </option>
              ))}
            </select>

            {/* Tutor Filter */}
            <select
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Tutors</option>
              {tutors.map(tutor => (
                <option key={tutor._id} value={tutor._id}>
                  {tutor.name}
                </option>
              ))}
            </select>

            {/* Clear Filters Button */}
            {(searchQuery || selectedCenter || selectedTutor) && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                <FiX className="mr-2" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Center
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {filteredStudents.map((student) => (
                    <motion.tr
                      key={student._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.assignedCenter ? (
                            <div>
                              <div className="font-medium">{student.assignedCenter.name}</div>
                              <div className="text-xs text-gray-400">{student.assignedCenter.area}</div>
                            </div>
                          ) : (
                            'Not Assigned'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {student.assignedTutor ? (
                            <div>
                              <div className="font-medium">{student.assignedTutor.name}</div>
                              <div className="text-xs text-gray-400">{student.assignedTutor.phone}</div>
                            </div>
                          ) : (
                            'Not Assigned'
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Students; 