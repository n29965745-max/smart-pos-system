import React, { useState, useEffect } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';
import Pagination from '../components/Pagination';
import ResponsiveGrid, { ResponsiveCard } from '../components/ResponsiveGrid';
import ResponsiveFilters from '../components/ResponsiveFilters';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  customer_type: string;
  status: string;
  total_purchases: number;
  total_transactions: number;
  last_purchase_date: string;
  created_at: string;
}

export default function CustomersPage() {
  const { toast, showToast, hideToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [customerCreditInfo, setCustomerCreditInfo] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Kenya',
    notes: '',
    customerType: 'retail',
    debtLimit: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, currentPage, itemsPerPage]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchQuery,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });

      const response = await fetch(`/api/customers/list?${params}`);
      const data = await response.json();

      if (response.ok) {
        setCustomers(data.customers || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCustomers(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Customer added successfully!', 'success');
        setShowAddModal(false);
        resetForm();
        fetchCustomers();
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error adding customer:', error);
      showToast('Failed to add customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;

    setLoading(true);

    try {
      const response = await fetch('/api/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCustomer.id,
          ...formData
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Customer updated successfully!', 'success');
        setShowEditModal(false);
        setSelectedCustomer(null);
        resetForm();
        fetchCustomers();
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error updating customer:', error);
      showToast('Failed to update customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/customers?id=${customerId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Customer deleted successfully!', 'success');
        fetchCustomers();
      } else {
        showToast(`Error: ${data.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      showToast('Failed to delete customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: '',
      lastName: '',
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      country: customer.country || 'Kenya',
      notes: customer.notes || '',
      customerType: customer.customer_type,
      debtLimit: ''
    });
    
    // Fetch customer credit info
    try {
      const response = await fetch(`/api/customers/credit?customerId=${customer.id}`);
      if (response.ok) {
        const creditData = await response.json();
        setCustomerCreditInfo(creditData);
        setFormData(prev => ({ ...prev, debtLimit: creditData.debtLimit?.toString() || '' }));
      }
    } catch (error) {
      console.error('Error fetching customer credit:', error);
    }
    
    setShowEditModal(true);
    setOpenDropdownId(null);
  };

  const openViewModal = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewModal(true);
    setOpenDropdownId(null);
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Kenya',
      notes: '',
      customerType: 'retail',
      debtLimit: ''
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const exportCustomers = () => {
    const headers = ['Name', 'Email', 'Phone', 'Total Purchases', 'Last Purchase'];
    const rows = customers.map(c => [
      c.name,
      c.email || 'N/A',
      c.phone || 'N/A',
      c.total_purchases.toFixed(2),
      formatDate(c.last_purchase_date)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      <div className="p-4 sm:p-5 lg:p-6">
        {/* Header */}
        <ResponsiveFilters
          title="Customers"
          subtitle="Manage your customer base and view their details"
          actions={
            <>
              <button
                onClick={exportCustomers}
                className="w-full sm:w-auto bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg px-4 py-2 sm:py-2.5 text-sm hover:bg-[var(--bg-primary)] transition-colors flex items-center gap-2 justify-center min-h-[44px] sm:min-h-[36px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 sm:py-2.5 text-sm font-medium transition-colors flex items-center gap-2 justify-center min-h-[44px] sm:min-h-[36px]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Customer
              </button>
            </>
          }
        >
          <></>
        </ResponsiveFilters>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <svg className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search customers by name, email, or phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full relative">
              <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)] hidden sm:table-cell">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)] hidden md:table-cell">Total Purchases</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)] hidden lg:table-cell">Last Purchase</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-[var(--text-secondary)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                      Loading customers...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-secondary)]">
                      No customers found
                    </td>
                  </tr>
                ) : (
                  customers.map((customer, index) => (
                    <tr key={customer.id} className="hover:bg-[var(--bg-primary)] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-[var(--text-primary)]">
                        {customer.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)] hidden sm:table-cell">
                        {customer.email || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                        {customer.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-[var(--text-primary)] hidden md:table-cell">
                        {customer.total_purchases > 0 ? customer.total_purchases.toFixed(0) : '0'}
                      </td>
                      <td className="px-6 py-4 text-sm text-[var(--text-secondary)] hidden lg:table-cell">
                        {formatDate(customer.last_purchase_date)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === customer.id ? null : customer.id);
                          }}
                          className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalCustomers > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCustomers}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newItemsPerPage) => {
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1);
              }}
              itemName="customers"
            />
          )}
        </div>

        {/* Dropdown Menu - Rendered outside table to avoid overflow issues */}
        {openDropdownId && customers.find(c => c.id === openDropdownId) && (
          <>
            {/* Backdrop to close dropdown */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpenDropdownId(null)}
            />
            
            {/* Dropdown */}
            <div
              className="fixed w-48 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 py-1"
              style={{
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <button
                onClick={() => openViewModal(customers.find(c => c.id === openDropdownId)!)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-primary)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View Details
              </button>
              <button
                onClick={() => openEditModal(customers.find(c => c.id === openDropdownId)!)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--bg-primary)] flex items-center gap-2 text-[var(--text-primary)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => {
                  const customer = customers.find(c => c.id === openDropdownId);
                  setOpenDropdownId(null);
                  if (customer) handleDeleteCustomer(customer.id);
                }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 flex items-center gap-2 text-red-500"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full relative">
            {/* Close Button */}
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="absolute top-4 right-4 text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl leading-none"
            >
              ×
            </button>

            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-1">Add New Customer</h2>
              <p className="text-sm text-[var(--text-secondary)]">Fill in the details for the new customer.</p>
            </div>
            
            <form onSubmit={handleAddCustomer} className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter last name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              {/* Customer Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Customer Type</label>
                <select
                  value={formData.customerType}
                  onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="retail">Retail Customer</option>
                  <option value="wholesale">Wholesale Customer</option>
                </select>
              </div>

              {/* Debt Limit */}
              <div>
                <label className="block text-sm font-medium mb-2">Debt Limit</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.debtLimit}
                  onChange={(e) => setFormData({ ...formData, debtLimit: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">Maximum credit limit for this customer</p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2.5 px-6 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Saving...' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Customer</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">Update customer profile information</p>
            
            {/* Debt Information Section */}
            {customerCreditInfo && (
              <div className="mb-6 bg-[var(--bg-primary)] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Debt Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Credit Limit</div>
                    <div className="text-sm font-semibold">
                      KSH {customerCreditInfo.debtLimit?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Current Debt</div>
                    <div className="text-sm font-semibold text-emerald-500">
                      KSH {customerCreditInfo.currentDebt?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Available Credit</div>
                    <div className="text-sm font-semibold">
                      KSH {customerCreditInfo.availableCredit?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Credit Utilization</div>
                    <div className="text-sm font-semibold">
                      {customerCreditInfo.debtLimit > 0 
                        ? ((customerCreditInfo.currentDebt / customerCreditInfo.debtLimit) * 100).toFixed(1)
                        : '0.0'}%
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name.split(' ')[0] || ''}
                  onChange={(e) => {
                    const lastName = formData.name.split(' ').slice(1).join(' ');
                    setFormData({ ...formData, name: `${e.target.value} ${lastName}`.trim() });
                  }}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.name.split(' ').slice(1).join(' ') || ''}
                  onChange={(e) => {
                    const firstName = formData.name.split(' ')[0];
                    setFormData({ ...formData, name: `${firstName} ${e.target.value}`.trim() });
                  }}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  placeholder="0712345678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Credit Limit (Admin Only)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.debtLimit}
                  onChange={(e) => setFormData({ ...formData, debtLimit: e.target.value })}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-sm"
                  placeholder="1000"
                />
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">Maximum credit limit for this customer</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedCustomer(null); resetForm(); }}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white py-2 rounded-lg font-semibold"
                >
                  {loading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Customer Details Modal */}
      {showViewModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">{selectedCustomer.name}</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Customer since {formatDate(selectedCustomer.created_at)}
                </p>
              </div>
              <button
                onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Customer Info Grid */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Contact Information</h3>
                
                <div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs font-medium">Email</span>
                  </div>
                  <p className="text-sm">{selectedCustomer.email || 'No email'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-xs font-medium">Phone</span>
                  </div>
                  <p className="text-sm">{selectedCustomer.phone || 'No phone'}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs font-medium">Address</span>
                  </div>
                  <p className="text-sm">{selectedCustomer.address || 'No address'}</p>
                  {selectedCustomer.city && (
                    <p className="text-sm text-[var(--text-secondary)]">{selectedCustomer.city}, {selectedCustomer.country}</p>
                  )}
                </div>
              </div>

              {/* Purchase Statistics */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide">Purchase Statistics</h3>
                
                <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Total Purchases</div>
                  <div className="text-2xl font-bold text-emerald-500">
                    KSH {selectedCustomer.total_purchases.toFixed(2)}
                  </div>
                </div>

                <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Total Transactions</div>
                  <div className="text-2xl font-bold">{selectedCustomer.total_transactions}</div>
                </div>

                <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Last Purchase</div>
                  <div className="text-sm font-medium">
                    {formatDate(selectedCustomer.last_purchase_date)}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Type & Status */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-2">Customer Type</div>
                <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium capitalize">
                  {selectedCustomer.customer_type}
                </span>
              </div>
              <div>
                <div className="text-xs text-[var(--text-secondary)] mb-2">Status</div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  selectedCustomer.status === 'active' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {selectedCustomer.status}
                </span>
              </div>
            </div>

            {/* Notes */}
            {selectedCustomer.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-2">Notes</h3>
                <div className="bg-[var(--bg-primary)] rounded-lg p-4">
                  <p className="text-sm">{selectedCustomer.notes}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => { setShowViewModal(false); setSelectedCustomer(null); }}
                className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedCustomer);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
              >
                Edit Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
