import React, { useState, useEffect, useCallback } from 'react';
import { FiFilter, FiDownload, FiSave, FiCalendar, FiUsers, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse'; // For CSV export

// Mock function for API calls - replace with actual fetch/axios calls
const fetchHadiyaReportAPI = async (params) => {
  // params: { month, year, centerId, tutorId }
  // Simulating API call
  console.log('Fetching Hadiya Report with params:', params);
  // Construct query string
  const queryString = new URLSearchParams(params).toString();
  const token = JSON.parse(localStorage.getItem('userData'))?.token;
  try {
    const response = await fetch(`/api/hadiya/report?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch hadiya report');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const recordHadiyaPaymentAPI = async (paymentData) => {
  // paymentData: { tutorId, month, year, amountPaid, notes }
  console.log('Recording Hadiya Payment:', paymentData);
  const token = JSON.parse(localStorage.getItem('userData'))?.token;
  try {
    const response = await fetch('/api/hadiya/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to record payment');
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

const HadiyaManagement = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [hadiyaReport, setHadiyaReport] = useState({ report: [], grandTotalPaid: 0 });
  const [paymentInputs, setPaymentInputs] = useState({}); // Store { tutorId: { amountPaid: '' | number, notes: '' } }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [centers, setCenters] = useState([]);
  const [selectedCenter, setSelectedCenter] = useState(''); // For center filter
  const [searchTerm, setSearchTerm] = useState(''); // For tutor name search

  // TODO: Add state for filters like selectedCenter, searchTerm if needed
  // const [centers, setCenters] = useState([]); // For center filter dropdown
  // useEffect(() => { /* Fetch centers */ }, []);

  // Fetch centers for filter dropdown
  useEffect(() => {
    const fetchCenters = async () => {
      const token = JSON.parse(localStorage.getItem('userData'))?.token;
      try {
        const response = await fetch('/api/centers', { // Assuming this endpoint exists
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch centers');
        }
        const data = await response.json();
        setCenters(data);
      } catch (error) {
        console.error('Error fetching centers:', error);
        toast.error('Could not load centers for filtering.');
      }
    };
    fetchCenters();
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { month: selectedMonth, year: selectedYear };
      if (selectedCenter) {
        params.centerId = selectedCenter;
      }
      if (searchTerm) {
        params.tutorName = searchTerm.trim(); // Add tutorName to params
      }
      // TODO: Add tutorId to params if filters are implemented
      const data = await fetchHadiyaReportAPI(params);
      setHadiyaReport(data);
      // Initialize paymentInputs based on fetched report
      const initialInputs = {};
      data.report.forEach(tutorData => {
        // Find if a payment record already exists for this tutor for the selected month/year
        const existingRecord = tutorData.hadiyaRecords.find(
          r => r.month === selectedMonth && r.year === selectedYear
        );
        initialInputs[tutorData.tutorId] = {
          amountPaid: existingRecord ? existingRecord.amountPaid : '',
          notes: existingRecord ? existingRecord.notes : ''
        };
      });
      setPaymentInputs(initialInputs);
    } catch (err) {
      setError(err.message || 'Failed to fetch Hadiya report.');
      toast.error(err.message || 'Failed to fetch Hadiya report.');
    }
    setLoading(false);
  }, [selectedMonth, selectedYear, selectedCenter, searchTerm]); // Added searchTerm to dependency array

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleInputChange = (tutorId, field, value) => {
    setPaymentInputs(prev => ({
      ...prev,
      [tutorId]: {
        ...(prev[tutorId] || {}),
        [field]: value
      }
    }));
  };

  const handleSavePayments = async () => {
    setIsSubmitting(true);
    setError(null);
    let successCount = 0;
    let errorCount = 0;

    const paymentPromises = Object.entries(paymentInputs)
      .filter(([tutorId, data]) => data.amountPaid !== '' && data.amountPaid !== null && data.amountPaid !== undefined && parseFloat(data.amountPaid) >= 0)
      .map(([tutorId, data]) => {
        const paymentData = {
          tutorId,
          month: selectedMonth,
          year: selectedYear,
          amountPaid: parseFloat(data.amountPaid),
          notes: data.notes || ''
        };
        return recordHadiyaPaymentAPI(paymentData)
          .then(() => successCount++)
          .catch(err => {
            errorCount++;
            toast.error(`Failed for tutor ${tutorId.slice(-5)}: ${err.message.substring(0,30)}`);
            console.error(`Payment failed for tutor ${tutorId}:`, err);
          });
      });

    await Promise.all(paymentPromises);

    if (successCount > 0) {
      toast.success(`${successCount} payment(s) recorded successfully!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} payment(s) failed. Check console for details.`);
    }
    if (successCount > 0 || errorCount === 0 && paymentPromises.length > 0) {
        fetchReport(); // Refresh data after saving
    }
    setIsSubmitting(false);
  };

  const handleExportCSV = () => {
    if (!hadiyaReport.report || hadiyaReport.report.length === 0) {
      toast.error('No data to export.');
      return;
    }

    const csvData = hadiyaReport.report.map(tutorData => {
      const paymentRecord = tutorData.hadiyaRecords.find(r => r.month === selectedMonth && r.year === selectedYear) || {};
      return {
        'Tutor ID': tutorData.tutorId,
        'Tutor Name': tutorData.tutorName,
        'Assigned Center': tutorData.assignedCenter?.name || 'N/A',
        'Assigned Hadiya Amount (₹)': tutorData.assignedHadiyaAmount,
        'Month': selectedMonth,
        'Year': selectedYear,
        'Amount Paid (₹)': paymentRecord.amountPaid !== undefined ? paymentRecord.amountPaid : 'Not Paid',
        'Date Paid': paymentRecord.datePaid ? new Date(paymentRecord.datePaid).toLocaleDateString() : 'N/A',
        'Notes': paymentRecord.notes || ''
      };
    });
    
    const totalRow = {
        'Tutor ID': 'GRAND TOTAL',
        'Tutor Name': '',
        'Assigned Center': '',
        'Assigned Hadiya Amount (₹)': '',
        'Month': '',
        'Year': '',
        'Amount Paid (₹)': hadiyaReport.grandTotalPaid,
        'Date Paid': '',
        'Notes': ''
    };
    csvData.push(totalRow);

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `hadiya_report_${selectedMonth}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV report exported successfully!');
  };

  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i); // Last 5 years + next 4 years
  const months = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
    { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
    { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' }
  ];

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-cyan-500 bg-clip-text text-transparent">
          <FiDollarSign className="inline-block mr-3 text-green-500" size={30}/> Hadiya Management
        </h1>
        {/* TODO: Add overall stats or summary here if needed */}
      </div>

      {/* Filters and Actions Bar */}
      <div className="bg-white p-4 rounded-xl shadow-lg space-y-4 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full md:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            >
              {years.map(year => <option key={year} value={year}>{year}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full md:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            >
              {months.map(month => <option key={month.value} value={month.value}>{month.label}</option>)}
            </select>
          </div>
          {/* TODO: Add Center Filter Dropdown */}
          <div>
            <label htmlFor="center-filter-select" className="block text-sm font-medium text-gray-700 mb-1">Center</label>
            <select
              id="center-filter-select"
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="w-full md:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
            >
              <option value="">All Centers</option>
              {centers && centers.map(center => (
                <option key={center._id} value={center._id}>
                  {center.name}
                </option>
              ))}
            </select>
          </div>
          {/* TODO: Add Tutor Search Input */}
          <div>
            <label htmlFor="tutor-search-input" className="block text-sm font-medium text-gray-700 mb-1">Search Tutor</label>
            <div className="relative">
              <input
                id="tutor-search-input"
                type="text"
                placeholder="Enter tutor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-auto pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
              />
              {/* Optional: Add a search icon inside the input */}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button
            onClick={handleSavePayments}
            disabled={isSubmitting || loading}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center disabled:opacity-50"
          >
            <FiSave className="mr-2" /> {isSubmitting ? 'Saving...' : 'Save Payments'}
          </button>
          <button
            onClick={handleExportCSV}
            disabled={loading || hadiyaReport.report.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center disabled:opacity-50"
          >
            <FiDownload className="mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-600">Loading Hadiya data...</span>
        </div>
      )}
      {!loading && error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      {!loading && !error && (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-100 z-10">Tutor Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Center</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned Hadiya (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Amount Paid (₹)</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Payment Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Notes</th>
                {/* Add more columns if needed, e.g., Date Paid */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hadiyaReport.report.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <FiUsers size={48} className="mx-auto mb-4 text-gray-400"/>
                    <p className="text-xl font-semibold">No tutor data found for the selected period.</p>
                    <p>Try adjusting the filters or ensure tutors have assigned Hadiya amounts.</p>
                  </td>
                </tr>
              ) : (
                hadiyaReport.report.map((tutor) => {
                  const paymentData = paymentInputs[tutor.tutorId] || { amountPaid: '', notes: '' };
                  const assignedAmount = tutor.assignedHadiyaAmount || 0;
                  const amountPaidNum = parseFloat(paymentData.amountPaid);
                  let paymentStatus = 'Pending';
                  let statusColor = 'bg-yellow-100 text-yellow-800';

                  if (amountPaidNum > 0) {
                    if (amountPaidNum >= assignedAmount) {
                      paymentStatus = 'Paid';
                      statusColor = 'bg-green-100 text-green-800';
                    } else {
                      paymentStatus = 'Partial';
                      statusColor = 'bg-orange-100 text-orange-800';
                    }
                  } else if (paymentData.amountPaid === '0' || paymentData.amountPaid === 0) {
                     paymentStatus = 'Not Paid'; 
                     statusColor = 'bg-red-100 text-red-800';
                  } else if (assignedAmount === 0 && (paymentData.amountPaid === '' || paymentData.amountPaid === null || paymentData.amountPaid === undefined)){
                    paymentStatus = 'N/A (No Hadiya)';
                    statusColor = 'bg-gray-100 text-gray-600';
                  }

                  return (
                    <tr key={tutor.tutorId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                        <div className="font-medium text-gray-900">{tutor.tutorName}</div>
                        <div className="text-sm text-gray-500">ID: ...{tutor.tutorId.slice(-6)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{tutor.assignedCenter?.name || 'N/A'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 font-medium">{assignedAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          value={paymentData.amountPaid}
                          onChange={(e) => handleInputChange(tutor.tutorId, 'amountPaid', e.target.value)}
                          placeholder="Enter amount"
                          min="0"
                          className="w-32 px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm transition-colors"
                          disabled={isSubmitting}
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
                          {paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="text"
                          value={paymentData.notes}
                          onChange={(e) => handleInputChange(tutor.tutorId, 'notes', e.target.value)}
                          placeholder="Optional notes"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 text-sm transition-colors"
                          disabled={isSubmitting}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {hadiyaReport.report.length > 0 && (
                <tfoot className="bg-gray-100">
                    <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm font-bold text-gray-700 uppercase sticky left-0 bg-gray-100 z-10">Grand Total Paid:</td>
                        <td className="px-4 py-3 text-left text-sm font-bold text-gray-900">
                            ₹ {hadiyaReport.grandTotalPaid.toLocaleString('en-IN')}
                        </td>
                        <td colSpan="2" className="px-4 py-3"></td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
      )}
       {/* Confirmation Modals or other UI elements can go here */}
    </div>
  );
};

export default HadiyaManagement;
