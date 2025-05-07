import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2, FiPlus, FiSearch, FiUser, FiMail, FiPhone } from 'react-icons/fi';
import useGet from '../../hooks/useGet';
import { toast } from 'react-hot-toast';

const AdminManagement = () => {
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  const { data: admins, loading, error: fetchError, refetch } = useGet('/admin');

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      confirmPassword: '',
      phone: ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    // Validate password length before submitting
    if (!editingAdmin && formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    // Only check password match if password is being changed
    if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const url = editingAdmin
        ? `${import.meta.env.VITE_API_URL}/admin/${editingAdmin._id}`
        : `${import.meta.env.VITE_API_URL}/auth/admin/register`;
      
      // Prepare request body
      let requestBody = {};
      
      if (editingAdmin) {
        // For updates, only include fields that have changed
        if (formData.name !== editingAdmin.name) {
          requestBody.name = formData.name;
        }
        if (formData.email !== editingAdmin.email) {
          requestBody.email = formData.email;
        }
        if (formData.phone !== editingAdmin.phone) {
          requestBody.phone = formData.phone;
        }
        if (formData.password) {
          requestBody.password = formData.password;
        }
      } else {
        // For new admin, include all required fields
        requestBody = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password
        };
      }

      console.log('Sending request:', {
        url,
        method: editingAdmin ? 'PUT' : 'POST',
        body: requestBody
      });

      const response = await fetch(
        url,
        {
          method: editingAdmin ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(requestBody)
        }
      );

      const data = await response.json();
      console.log('Response:', data);
      
      if (!response.ok) {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessage = data.errors.join(', ');
          setError(errorMessage);
          throw new Error(errorMessage);
        }
        if (data.message) {
          setError(data.message);
          throw new Error(data.message);
        }
        const errorMessage = 'Failed to save admin';
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      toast.success(editingAdmin ? 'Admin updated successfully' : 'Admin created successfully');
      setShowForm(false);
      setEditingAdmin(null);
      setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
      refetch();
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = err.message || 'An error occurred while saving the admin';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add password validation helper
  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  // Add password change handler with validation
  const handlePasswordChange = (e) => {
    const password = e.target.value;
    const error = validatePassword(password);
    setError(error);
    setFormData(prev => ({ ...prev, password }));
  };

  const handleDelete = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/${adminId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete admin');
      }
      toast.success('Admin deleted successfully');
      refetch();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filteredAdmins = admins?.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAdmins.length / itemsPerPage);
  const paginatedAdmins = filteredAdmins.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary-700">Admin Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingAdmin(null);
              setFormData({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
              setShowForm(true);
            }}
            className="flex items-center bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <FiPlus className="mr-2" /> Add New Admin
          </button>
        </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
        <div className="relative w-full md:w-1/2">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search admins by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
            ) : fetchError ? (
              <tr><td colSpan={4} className="text-center text-red-500 py-8">Error loading admins: {fetchError}</td></tr>
            ) : paginatedAdmins.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-500">No admins found.</td></tr>
            ) : paginatedAdmins.map((admin) => (
              <tr key={admin._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                      {admin.name?.charAt(0)?.toUpperCase() || <FiUser />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{admin.name}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700">
                    <FiMail className="mr-2 text-primary-600" />
                    {admin.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center text-sm text-gray-700">
                    <FiPhone className="mr-2 text-primary-600" />
                    {admin.phone || 'Not provided'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(admin)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                    title="Edit"
                  >
                    <FiEdit2 className="inline-block" />
                  </button>
                  <button
                    onClick={() => handleDelete(admin._id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <FiTrash2 className="inline-block" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">
                {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={!editingAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      required={!editingAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      pattern="[0-9]{10}"
                      placeholder="Enter 10-digit phone number"
                      required={!editingAdmin}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {editingAdmin ? 'New Password (leave blank to keep current)' : 'Password'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={handlePasswordChange}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        error && error.includes('Password') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={!editingAdmin}
                      minLength={6}
                    />
                    {error && error.includes('Password') && (
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {editingAdmin ? 'Confirm New Password' : 'Confirm Password'}
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        error && error.includes('match') ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required={!editingAdmin}
                      minLength={6}
                    />
                    {error && error.includes('match') && (
                      <p className="mt-1 text-sm text-red-600">{error}</p>
                    )}
                  </div>
                </div>
                {error && !error.includes('Password') && !error.includes('match') && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAdmin(null);
                      setError(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : editingAdmin ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminManagement; 