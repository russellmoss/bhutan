import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import Header from '../components/Header';
import InputField from '../components/InputField';
import Button from '../components/Button';
import '../styles/global.css';

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name'); // 'name' or 'email'
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redeemingCustomerId, setRedeemingCustomerId] = useState(null);
  const [redeemingDiscount, setRedeemingDiscount] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const navigate = useNavigate();

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/admin');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setCustomers([]);
    setIsLoading(true);

    try {
      // For fuzzy matching, we'll get a larger set of results and filter client-side
      // This is more efficient than trying to do complex queries in Firestore
      let customersQuery;
      
      if (searchType === 'name') {
        // Get all customers and filter by name
        customersQuery = query(
          collection(db, 'customers'),
          orderBy('name'),
          limit(100) // Limit to 100 results for performance
        );
      } else {
        // Get all customers and filter by email
        customersQuery = query(
          collection(db, 'customers'),
          orderBy('email'),
          limit(100) // Limit to 100 results for performance
        );
      }

      const querySnapshot = await getDocs(customersQuery);
      
      if (querySnapshot.empty) {
        setError('No customers found in the database.');
        setIsLoading(false);
        return;
      }

      const customersData = [];
      const searchTermLower = searchTerm.toLowerCase();
      
      // For each customer, check if they match our search criteria
      for (const customerDoc of querySnapshot.docs) {
        const customerId = customerDoc.id;
        const customerData = customerDoc.data();
        
        // Fuzzy matching logic
        let isMatch = false;
        
        if (searchType === 'name') {
          // Check if the name contains the search term (case insensitive)
          isMatch = customerData.name && 
                   customerData.name.toLowerCase().includes(searchTermLower);
        } else {
          // Check if the email contains the search term (case insensitive)
          isMatch = customerData.email && 
                   customerData.email.toLowerCase().includes(searchTermLower);
        }
        
        if (isMatch) {
          // Get engagement data
          const engagementDoc = await getDoc(doc(db, 'engagement', customerId));
          const engagementData = engagementDoc.exists() ? engagementDoc.data() : {};
          
          customersData.push({
            id: customerId,
            ...customerData,
            ...engagementData
          });
        }
      }
      
      if (customersData.length === 0) {
        setError('No customers found matching your search criteria.');
      } else {
        setCustomers(customersData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching. Please try again.');
      setIsLoading(false);
    }
  };

  const handleRedeemDiscount = async (customerId) => {
    try {
      setRedeemingDiscount(true);
      const engagementRef = doc(db, 'engagement', customerId);
      await updateDoc(engagementRef, {
        discountRedeemed: true,
        discountRedeemedAt: serverTimestamp()
      });
      
      // Update local state
      setCustomers(customers.map(customer => 
        customer.id === customerId 
          ? { ...customer, discountRedeemed: true, discountRedeemedAt: new Date() }
          : customer
      ));
      
      setSuccessMessage('Discount redeemed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error redeeming discount:', error);
      setError('Failed to redeem discount. Please try again.');
    } finally {
      setRedeemingDiscount(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/admin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      console.log('Exporting with date filters:', { startDate, endDate });
      
      // Create a query to get all customers
      let customersQuery = query(collection(db, 'customers'), orderBy('timestamp', 'desc'));
      
      // Apply date filters if provided
      if (startDate) {
        const startDateObj = new Date(startDate);
        startDateObj.setHours(0, 0, 0, 0);
        console.log('Start date filter:', startDateObj);
        console.log('Start date timestamp:', startDateObj.getTime());
        
        // Convert to Firestore Timestamp
        customersQuery = query(
          customersQuery, 
          where('timestamp', '>=', startDateObj)
        );
      }
      
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        console.log('End date filter:', endDateObj);
        console.log('End date timestamp:', endDateObj.getTime());
        
        // Convert to Firestore Timestamp
        customersQuery = query(
          customersQuery, 
          where('timestamp', '<=', endDateObj)
        );
      }
      
      // If no date filters are provided, just get all customers
      if (!startDate && !endDate) {
        console.log('No date filters applied, getting all customers');
      }
      
      const querySnapshot = await getDocs(customersQuery);
      console.log('Query returned', querySnapshot.size, 'documents');
      
      // Debug: Log each document's timestamp
      querySnapshot.forEach(doc => {
        const data = doc.data();
        console.log('Document timestamp:', data.timestamp, 
                    'Document date:', data.timestamp ? new Date(data.timestamp.seconds * 1000) : 'No timestamp');
      });
      
      if (querySnapshot.empty) {
        setError('No customers found matching the date criteria.');
        setIsExporting(false);
        return;
      }
      
      // Prepare CSV data
      const csvRows = [];
      
      // Add header row
      csvRows.push([
        'Name', 
        'Email', 
        'Date Added', 
        'Google Review', 
        'Instagram Follow', 
        'Discount Redeemed', 
        'Discount Redeemed Date'
      ]);
      
      // Process each customer
      for (const customerDoc of querySnapshot.docs) {
        const customerId = customerDoc.id;
        const customerData = customerDoc.data();
        
        console.log('Processing customer:', customerData.name, 'with timestamp:', customerData.timestamp);
        
        // Get engagement data
        const engagementDoc = await getDoc(doc(db, 'engagement', customerId));
        const engagementData = engagementDoc.exists() ? engagementDoc.data() : {};
        
        // Format dates - handle Firestore timestamp properly
        let dateAdded = 'N/A';
        if (customerData.timestamp) {
          // Check if timestamp is a Firestore Timestamp object
          if (customerData.timestamp.toDate) {
            dateAdded = customerData.timestamp.toDate().toLocaleDateString();
          } else if (customerData.timestamp.seconds) {
            // Handle timestamp with seconds property
            dateAdded = new Date(customerData.timestamp.seconds * 1000).toLocaleDateString();
          } else {
            // Handle regular Date object
            dateAdded = new Date(customerData.timestamp).toLocaleDateString();
          }
        }
        
        let discountRedeemedDate = 'N/A';
        if (engagementData.discountRedeemedAt) {
          // Check if timestamp is a Firestore Timestamp object
          if (engagementData.discountRedeemedAt.toDate) {
            discountRedeemedDate = engagementData.discountRedeemedAt.toDate().toLocaleDateString();
          } else if (engagementData.discountRedeemedAt.seconds) {
            // Handle timestamp with seconds property
            discountRedeemedDate = new Date(engagementData.discountRedeemedAt.seconds * 1000).toLocaleDateString();
          } else {
            // Handle regular Date object
            discountRedeemedDate = new Date(engagementData.discountRedeemedAt).toLocaleDateString();
          }
        }
        
        // Add customer data row
        csvRows.push([
          customerData.name || 'N/A',
          customerData.email || 'N/A',
          dateAdded,
          engagementData.googleReviewed ? 'Yes' : 'No',
          engagementData.instagramFollowed ? 'Yes' : 'No',
          engagementData.discountRedeemed ? 'Yes' : 'No',
          discountRedeemedDate
        ]);
      }
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const escapedCell = cell.toString().replace(/"/g, '""');
          return escapedCell.includes(',') ? `"${escapedCell}"` : escapedCell;
        }).join(',')
      ).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bhutan-customers-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage('CSV file downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDirectExportCSV = async () => {
    try {
      setIsExporting(true);
      setError('');
      
      console.log('Direct export without date filters');
      
      // Create a query to get all customers without date filtering
      const customersQuery = query(collection(db, 'customers'), orderBy('timestamp', 'desc'));
      
      const querySnapshot = await getDocs(customersQuery);
      console.log('Query returned', querySnapshot.size, 'documents');
      
      if (querySnapshot.empty) {
        setError('No customers found in the database.');
        setIsExporting(false);
        return;
      }
      
      // Prepare CSV data
      const csvRows = [];
      
      // Add header row
      csvRows.push([
        'Name', 
        'Email', 
        'Date Added', 
        'Google Review', 
        'Instagram Follow', 
        'Discount Redeemed', 
        'Discount Redeemed Date'
      ]);
      
      // Process each customer
      for (const customerDoc of querySnapshot.docs) {
        const customerId = customerDoc.id;
        const customerData = customerDoc.data();
        
        console.log('Processing customer:', customerData.name, 'with timestamp:', customerData.timestamp);
        
        // Get engagement data
        const engagementDoc = await getDoc(doc(db, 'engagement', customerId));
        const engagementData = engagementDoc.exists() ? engagementDoc.data() : {};
        
        // Format dates - handle Firestore timestamp properly
        let dateAdded = 'N/A';
        if (customerData.timestamp) {
          // Check if timestamp is a Firestore Timestamp object
          if (customerData.timestamp.toDate) {
            dateAdded = customerData.timestamp.toDate().toLocaleDateString();
          } else if (customerData.timestamp.seconds) {
            // Handle timestamp with seconds property
            dateAdded = new Date(customerData.timestamp.seconds * 1000).toLocaleDateString();
          } else {
            // Handle regular Date object
            dateAdded = new Date(customerData.timestamp).toLocaleDateString();
          }
        }
        
        let discountRedeemedDate = 'N/A';
        if (engagementData.discountRedeemedAt) {
          // Check if timestamp is a Firestore Timestamp object
          if (engagementData.discountRedeemedAt.toDate) {
            discountRedeemedDate = engagementData.discountRedeemedAt.toDate().toLocaleDateString();
          } else if (engagementData.discountRedeemedAt.seconds) {
            // Handle timestamp with seconds property
            discountRedeemedDate = new Date(engagementData.discountRedeemedAt.seconds * 1000).toLocaleDateString();
          } else {
            // Handle regular Date object
            discountRedeemedDate = new Date(engagementData.discountRedeemedAt).toLocaleDateString();
          }
        }
        
        // Add customer data row
        csvRows.push([
          customerData.name || 'N/A',
          customerData.email || 'N/A',
          dateAdded,
          engagementData.googleReviewed ? 'Yes' : 'No',
          engagementData.instagramFollowed ? 'Yes' : 'No',
          engagementData.discountRedeemed ? 'Yes' : 'No',
          discountRedeemedDate
        ]);
      }
      
      // Convert to CSV string
      const csvContent = csvRows.map(row => 
        row.map(cell => {
          // Escape quotes and wrap in quotes if contains comma
          const escapedCell = cell.toString().replace(/"/g, '""');
          return escapedCell.includes(',') ? `"${escapedCell}"` : escapedCell;
        }).join(',')
      ).join('\n');
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `bhutan-customers-all-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage('CSV file downloaded successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      setError('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container">
      <Header />
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="button secondary-button">Logout</button>
      </div>
      
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-container">
          <InputField 
            label="Search Term"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Enter customer ${searchType}`}
            required
          />
          <div className="search-type-selector">
            <label>Search by:</label>
            <select 
              value={searchType} 
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
          </div>
          <Button 
            text={isLoading ? "Searching..." : "Search"}
            type="submit"
            disabled={isLoading}
          />
        </div>
      </form>
      
      <div className="export-section">
        <h3>Export Customer Data</h3>
        <div className="date-filters">
          <div className="date-input">
            <label>Start Date:</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input">
            <label>End Date:</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handleExportCSV} 
            disabled={isExporting}
            className="export-button"
            style={{
              backgroundColor: 'var(--accent-color)',
              color: 'black',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              height: '40px',
              marginLeft: 'auto'
            }}
          >
            {isExporting ? 'Exporting...' : 'Export as CSV'}
          </button>
          <button 
            onClick={handleDirectExportCSV} 
            disabled={isExporting}
            className="export-button direct-export"
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              height: '40px',
              marginLeft: '10px'
            }}
          >
            {isExporting ? 'Exporting...' : 'Export All'}
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : customers.length > 0 ? (
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Google Review</th>
                <th>Instagram Follow</th>
                <th>Discount Redeemed</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(customer => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.email}</td>
                  <td>{customer.googleReviewed ? '✓' : '✗'}</td>
                  <td>{customer.instagramFollowed ? '✓' : '✗'}</td>
                  <td>{customer.discountRedeemed ? '✓' : '✗'}</td>
                  <td>{customer.timestamp ? new Date(customer.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    {!customer.discountRedeemed && (customer.googleReviewed || customer.instagramFollowed) && (
                      <Button 
                        text={redeemingDiscount ? (
                          <div className="loading-spinner"></div>
                        ) : (
                          "Redeem"
                        )}
                        onClick={() => handleRedeemDiscount(customer.id)}
                        className="redeem-button"
                        disabled={redeemingDiscount}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard; 