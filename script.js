/**
 * script.js - Complete Camva Pro CRM JavaScript with Supabase Integration
 * Single Page Application with full customer management functionality
 */

// ===============================================
// SUPABASE CONFIGURATION
// ===============================================

const SUPABASE_URL = 'https://wpwdzccyvfupcjrwtaqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwd2R6Y2N5dmZ1cGNqcnd0YXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNDE1MjUsImV4cCI6MjA2OTYxNzUyNX0.N8n1p9IrvLFODHs_pSCROSB3yzKHtqWSGL9SZkrs6v8';

// Initialize Supabase client using CDN
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ===============================================
// GLOBAL VARIABLES & DOM ELEMENTS
// ===============================================

let allCustomers = [];
let filteredCustomers = [];
let currentFilter = 'all';
let currentEditingCustomer = null;

// Dashboard Elements
const totalCustomersEl = document.getElementById('totalCustomers');
const activeSubscriptionsEl = document.getElementById('activeSubscriptions');
const expiringThisWeekEl = document.getElementById('expiringThisWeek');
const totalRevenueEl = document.getElementById('totalRevenue');

// Grid & UI Elements
const customersGridEl = document.getElementById('customersGrid');
const loadingSpinnerEl = document.getElementById('loadingSpinner');
const noResultsEl = document.getElementById('noResults');
const loadingOverlayEl = document.getElementById('loadingOverlay');
const toastContainerEl = document.getElementById('toastContainer');

// Modal Elements
const customerModal = document.getElementById('customerModal');
const customerForm = document.getElementById('customerForm');
const modalTitleEl = document.getElementById('modalTitle');
const renewModal = document.getElementById('renewModal');
const renewForm = document.getElementById('renewForm');
const renewCustomerInfoEl = document.getElementById('renewCustomerInfo');

// Search Elements
const searchInputEl = document.getElementById('searchInput');

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Format number as Indian currency (₹)
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

/**
 * Format date to Indian format
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN');
}

/**
 * Calculate days difference between two dates
 */
function daysDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d2 - d1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Get today's date in YYYY-MM-DD format
 */
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

/**
 * Get date 7 days from today
 */
function getWeekFromToday() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
}

/**
 * Determine customer status based on expiry date
 */
function getCustomerStatus(expiryDate) {
    if (!expiryDate) return 'active';
    
    const today = getTodayDate();
    const weekFromToday = getWeekFromToday();
    
    if (expiryDate < today) return 'expired';
    if (expiryDate <= weekFromToday) return 'expiring';
    return 'active';
}

/**
 * Show loading overlay
 */
function showLoadingOverlay(show = true) {
    loadingOverlayEl.style.display = show ? 'flex' : 'none';
}

/**
 * Show loading spinner in customers section
 */
function showLoadingSpinner(show = true) {
    loadingSpinnerEl.style.display = show ? 'block' : 'none';
    customersGridEl.style.display = show ? 'none' : 'grid';
}

// ===============================================
// TOAST NOTIFICATION SYSTEM
// ===============================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = 5000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${iconMap[type] || iconMap.info}"></i>
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="removeToast(this)">&times;</button>
    `;
    
    toastContainerEl.appendChild(toast);
    
    // Auto remove after duration
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast.querySelector('.toast-close'));
        }, duration);
    }
}

/**
 * Remove toast notification
 */
function removeToast(closeBtn) {
    const toast = closeBtn.closest('.toast');
    if (toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

// ===============================================
// SUPABASE DATA OPERATIONS
// ===============================================

/**
 * Fetch all customers from Supabase
 */
async function fetchCustomers() {
    try {
        showLoadingSpinner(true);
        
        const { data, error } = await supabaseClient
            .from('customers')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Supabase fetch error:', error);
            showToast('Failed to load customers from database', 'error');
            return [];
        }
        
        // Update status based on expiry dates
        const customersWithStatus = data.map(customer => ({
            ...customer,
            status: getCustomerStatus(customer.expiry_date)
        }));
        
        showLoadingSpinner(false);
        return customersWithStatus;
        
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error: Please check your connection', 'error');
        showLoadingSpinner(false);
        return [];
    }
}

/**
 * Add new customer to Supabase
 */
async function addCustomer(customerData) {
    try {
        showLoadingOverlay(true);
        
        const { data, error } = await supabaseClient
            .from('customers')
            .insert([{
                ...customerData,
                status: getCustomerStatus(customerData.expiry_date),
                created_at: new Date().toISOString()
            }])
            .select()
            .single();
        
        showLoadingOverlay(false);
        
        if (error) {
            console.error('Supabase insert error:', error);
            showToast('Failed to add customer: ' + error.message, 'error');
            return null;
        }
        
        showToast('Customer added successfully!', 'success');
        
        // Send welcome message
        if (data && customerData.send_welcome) {
            sendWelcomeMessage(data.phone, data.email, data.name);
        }
        
        return data;
        
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error: Failed to add customer', 'error');
        showLoadingOverlay(false);
        return null;
    }
}

/**
 * Update existing customer in Supabase
 */
async function updateCustomer(customerId, customerData) {
    try {
        showLoadingOverlay(true);
        
        const { data, error } = await supabaseClient
            .from('customers')
            .update({
                ...customerData,
                status: getCustomerStatus(customerData.expiry_date),
                updated_at: new Date().toISOString()
            })
            .eq('id', customerId)
            .select()
            .single();
        
        showLoadingOverlay(false);
        
        if (error) {
            console.error('Supabase update error:', error);
            showToast('Failed to update customer: ' + error.message, 'error');
            return null;
        }
        
        showToast('Customer updated successfully!', 'success');
        return data;
        
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error: Failed to update customer', 'error');
        showLoadingOverlay(false);
        return null;
    }
}

/**
 * Renew customer subscription
 */
async function renewSubscription(customerId, renewalData) {
    try {
        showLoadingOverlay(true);
        
        const { data, error } = await supabaseClient
            .from('customers')
            .update({
                expiry_date: renewalData.expiry_date,
                payment_amount: renewalData.payment_amount,
                plan_type: renewalData.plan_type || null,
                status: getCustomerStatus(renewalData.expiry_date),
                last_renewal: new Date().toISOString(),
                renewal_notes: renewalData.notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', customerId)
            .select()
            .single();
        
        showLoadingOverlay(false);
        
        if (error) {
            console.error('Supabase renewal error:', error);
            showToast('Failed to renew subscription: ' + error.message, 'error');
            return null;
        }
        
        showToast('Subscription renewed successfully!', 'success');
        
        // Send renewal message
        if (data && renewalData.send_message) {
            sendRenewalMessage(data.phone, data.email, data.name, renewalData.expiry_date);
        }
        
        return data;
        
    } catch (error) {
        console.error('Network error:', error);
        showToast('Network error: Failed to renew subscription', 'error');
        showLoadingOverlay(false);
        return null;
    }
}

// ===============================================
// DASHBOARD CALCULATIONS
// ===============================================

/**
 * Calculate and update dashboard statistics
 */
function updateDashboardStats(customers) {
    const today = getTodayDate();
    const weekFromToday = getWeekFromToday();
    
    // Total customers
    const totalCustomers = customers.length;
    
    // Active subscriptions (not expired)
    const activeSubscriptions = customers.filter(c => 
        c.expiry_date && c.expiry_date >= today
    ).length;
    
    // Expiring this week
    const expiringThisWeek = customers.filter(c => 
        c.expiry_date && c.expiry_date >= today && c.expiry_date <= weekFromToday
    ).length;
    
    // Total revenue from active customers
    const totalRevenue = customers
        .filter(c => c.expiry_date && c.expiry_date >= today)
        .reduce((sum, c) => sum + (parseFloat(c.payment_amount) || 0), 0);
    
    // Update DOM elements
    totalCustomersEl.textContent = totalCustomers;
    activeSubscriptionsEl.textContent = activeSubscriptions;
    expiringThisWeekEl.textContent = expiringThisWeek;
    totalRevenueEl.textContent = formatCurrency(totalRevenue);
}

// ===============================================
// CUSTOMER RENDERING
// ===============================================

/**
 * Render customer cards in the grid
 */
function renderCustomers(customers) {
    if (customers.length === 0) {
        customersGridEl.style.display = 'none';
        noResultsEl.style.display = 'block';
        return;
    }
    
    noResultsEl.style.display = 'none';
    customersGridEl.style.display = 'grid';
    customersGridEl.innerHTML = '';
    
    customers.forEach(customer => {
        const card = createCustomerCard(customer);
        customersGridEl.appendChild(card);
    });
}

/**
 * Create individual customer card element
 */
function createCustomerCard(customer) {
    const card = document.createElement('div');
    card.className = 'customer-card';
    
    const statusClass = `status-${customer.status}`;
    const expiryInfo = customer.expiry_date ? 
        `Expires: ${formatDate(customer.expiry_date)}` : 
        'No expiry date';
    
    card.innerHTML = `
        <div class="customer-header">
            <div class="customer-info">
                <h3>${customer.name}</h3>
                <p><i class="fas fa-envelope"></i> ${customer.email}</p>
                <p><i class="fas fa-phone"></i> ${customer.phone}</p>
                ${customer.company ? `<p><i class="fas fa-building"></i> ${customer.company}</p>` : ''}
            </div>
            <div class="customer-status ${statusClass}">
                ${customer.status.toUpperCase()}
            </div>
        </div>
        
        <div class="customer-details">
            <div class="detail-row">
                <span class="detail-label">Team:</span>
                <span class="detail-value">${customer.team || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Plan:</span>
                <span class="detail-value">${customer.plan_type || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment:</span>
                <span class="detail-value">${customer.payment_amount ? formatCurrency(customer.payment_amount) : '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Join Date:</span>
                <span class="detail-value">${formatDate(customer.join_date)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Expiry:</span>
                <span class="detail-value">${formatDate(customer.expiry_date)}</span>
            </div>
        </div>
        
        <div class="customer-actions">
            <button class="btn btn-sm btn-primary" onclick="editCustomer('${customer.id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-sm btn-success" onclick="showRenewModal('${customer.id}')">
                <i class="fas fa-sync-alt"></i> Renew
            </button>
            <button class="btn btn-sm btn-info" onclick="sendMessage('${customer.id}')">
                <i class="fas fa-paper-plane"></i> Message
            </button>
            ${customer.status === 'expiring' ? `
                <button class="btn btn-sm btn-warning" onclick="sendReminderMessage('${customer.id}')">
                    <i class="fas fa-bell"></i> Remind
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

// ===============================================
// FILTERING & SEARCHING
// ===============================================

/**
 * Filter customers by status
 */
function filterCustomers(filter) {
    currentFilter = filter;
    
    let filtered = [...allCustomers];
    
    switch (filter) {
        case 'active':
            filtered = filtered.filter(c => c.status === 'active');
            break;
        case 'expiring':
            filtered = filtered.filter(c => c.status === 'expiring');
            break;
        case 'expired':
            filtered = filtered.filter(c => c.status === 'expired');
            break;
        default:
            // 'all' - no filtering
            break;
    }
    
    filteredCustomers = filtered;
    applySearchFilter();
    updateFilterTabs();
}

/**
 * Apply search filter to currently filtered customers
 */
function applySearchFilter() {
    const searchTerm = searchInputEl.value.toLowerCase().trim();
    
    let searchFiltered = filteredCustomers;
    
    if (searchTerm) {
        searchFiltered = filteredCustomers.filter(customer => 
            customer.name.toLowerCase().includes(searchTerm) ||
            customer.email.toLowerCase().includes(searchTerm) ||
            customer.phone.includes(searchTerm) ||
            (customer.company && customer.company.toLowerCase().includes(searchTerm)) ||
            (customer.team && customer.team.toLowerCase().includes(searchTerm)) ||
            (customer.plan_type && customer.plan_type.toLowerCase().includes(searchTerm))
        );
    }
    
    renderCustomers(searchFiltered);
}

/**
 * Update filter tab active states
 */
function updateFilterTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        const tabFilter = tab.textContent.toLowerCase();
        tab.classList.toggle('active', tabFilter === currentFilter);
    });
}

/**
 * Search customers (called from search input)
 */
function searchCustomers() {
    applySearchFilter();
}

/**
 * Show expiring customers
 */
function showExpiringCustomers() {
    filterCustomers('expiring');
}

// ===============================================
// MODAL OPERATIONS
// ===============================================

/**
 * Show add customer modal
 */
function showAddCustomerModal() {
    currentEditingCustomer = null;
    modalTitleEl.textContent = 'Add New Customer';
    resetCustomerForm();
    customerModal.classList.add('show');
}

/**
 * Edit existing customer
 */
function editCustomer(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) {
        showToast('Customer not found', 'error');
        return;
    }
    
    currentEditingCustomer = customer;
    modalTitleEl.textContent = 'Edit Customer';
    populateCustomerForm(customer);
    customerModal.classList.add('show');
}

/**
 * Reset customer form
 */
function resetCustomerForm() {
    customerForm.reset();
    document.getElementById('customerId').value = '';
    
    // Set default values
    document.getElementById('joinDate').value = getTodayDate();
    
    // Calculate default expiry date (1 month from today)
    const defaultExpiry = new Date();
    defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
    document.getElementById('expiryDate').value = defaultExpiry.toISOString().split('T')[0];
}

/**
 * Populate customer form with existing data
 */
function populateCustomerForm(customer) {
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name || '';
    document.getElementById('customerEmail').value = customer.email || '';
    document.getElementById('customerPhone').value = customer.phone || '';
    document.getElementById('customerTeam').value = customer.team || 'startup';
    document.getElementById('planType').value = customer.plan_type || 'monthly';
    document.getElementById('planAmount').value = customer.payment_amount || '';
    document.getElementById('joinDate').value = customer.join_date || '';
    document.getElementById('expiryDate').value = customer.expiry_date || '';
    document.getElementById('customerNotes').value = customer.notes || '';
}

/**
 * Close customer modal
 */
function closeCustomerModal() {
    customerModal.classList.remove('show');
    currentEditingCustomer = null;
}

/**
 * Show renewal modal
 */
function showRenewModal(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) {
        showToast('Customer not found', 'error');
        return;
    }
    
    // Populate renewal modal
    document.getElementById('renewCustomerId').value = customer.id;
    
    renewCustomerInfoEl.innerHTML = `
        <h4>${customer.name}</h4>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${customer.email}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${customer.phone}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Current Plan:</span>
            <span class="detail-value">${customer.plan_type || '-'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Current Expiry:</span>
            <span class="detail-value">${formatDate(customer.expiry_date)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status:</span>
            <span class="detail-value status-${customer.status}">${customer.status.toUpperCase()}</span>
        </div>
    `;
    
    // Set default new expiry date (extend by plan duration)
    const currentExpiry = customer.expiry_date ? new Date(customer.expiry_date) : new Date();
    const newExpiry = new Date(currentExpiry);
    
    // Extend based on plan type
    switch (customer.plan_type) {
        case 'yearly':
            newExpiry.setFullYear(newExpiry.getFullYear() + 1);
            break;
        case 'quarterly':
            newExpiry.setMonth(newExpiry.getMonth() + 3);
            break;
        default: // monthly
            newExpiry.setMonth(newExpiry.getMonth() + 1);
            break;
    }
    
    document.getElementById('newExpiryDate').value = newExpiry.toISOString().split('T')[0];
    document.getElementById('renewalAmount').value = customer.payment_amount || '';
    document.getElementById('renewalNotes').value = '';
    
    renewModal.classList.add('show');
}

/**
 * Close renewal modal
 */
function closeRenewModal() {
    renewModal.classList.remove('show');
}

// ===============================================
// FORM HANDLERS
// ===============================================

/**
 * Handle customer form submission
 */
customerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(customerForm);
    const customerData = {
        name: formData.get('customerName') || document.getElementById('customerName').value,
        email: formData.get('customerEmail') || document.getElementById('customerEmail').value,
        phone: formData.get('customerPhone') || document.getElementById('customerPhone').value,
        company: formData.get('customerCompany') || '',
        team: document.getElementById('customerTeam').value,
        plan_type: document.getElementById('planType').value,
        payment_amount: parseFloat(document.getElementById('planAmount').value) || 0,
        join_date: document.getElementById('joinDate').value,
        expiry_date: document.getElementById('expiryDate').value,
        notes: document.getElementById('customerNotes').value,
        send_welcome: !currentEditingCustomer // Send welcome only for new customers
    };
    
    // Validation
    if (!customerData.name || !customerData.email || !customerData.phone) {
        showToast('Name, email, and phone are required', 'error');
        return;
    }
    
    let result;
    if (currentEditingCustomer) {
        result = await updateCustomer(currentEditingCustomer.id, customerData);
    } else {
        result = await addCustomer(customerData);
    }
    
    if (result) {
        closeCustomerModal();
        await loadData();
    }
});

/**
 * Handle renewal form submission
 */
renewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const customerId = document.getElementById('renewCustomerId').value;
    const renewalData = {
        expiry_date: document.getElementById('newExpiryDate').value,
        payment_amount: parseFloat(document.getElementById('renewalAmount').value) || 0,
        notes: document.getElementById('renewalNotes').value,
        send_message: true
    };
    
    // Validation
    if (!renewalData.expiry_date || renewalData.payment_amount <= 0) {
        showToast('New expiry date and payment amount are required', 'error');
        return;
    }
    
    const result = await renewSubscription(customerId, renewalData);
    
    if (result) {
        closeRenewModal();
        await loadData();
    }
});

// ===============================================
// MESSAGING FUNCTIONS
// ===============================================

/**
 * Send welcome message via WhatsApp and Email
 */
function sendWelcomeMessage(phone, email, name) {
    const message = `Hello ${name}!\n\nWelcome to Camva Pro CRM! 🎉\n\nWe're excited to have you on board. Your subscription is now active and you can start exploring all our features.\n\nIf you have any questions, feel free to reach out to us.\n\nBest regards,\nCamva Pro Team`;
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Open Email
    const emailUrl = `mailto:${email}?subject=Welcome to Camva Pro CRM&body=${encodeURIComponent(message)}`;
    window.open(emailUrl, '_blank');
    
    showToast('Welcome message links opened', 'success');
}

/**
 * Send renewal message
 */
function sendRenewalMessage(phone, email, name, expiryDate) {
    const message = `Hello ${name}!\n\nYour Camva Pro CRM subscription has been successfully renewed! ✅\n\nNew expiry date: ${formatDate(expiryDate)}\n\nThank you for continuing with us. We appreciate your trust in our services.\n\nBest regards,\nCamva Pro Team`;
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Open Email
    const emailUrl = `mailto:${email}?subject=Subscription Renewed - Camva Pro CRM&body=${encodeURIComponent(message)}`;
    window.open(emailUrl, '_blank');
    
    showToast('Renewal message links opened', 'success');
}

/**
 * Send reminder message for expiring subscription
 */
function sendReminderMessage(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) return;
    
    const daysLeft = daysDifference(getTodayDate(), customer.expiry_date);
    const message = `Hello ${customer.name}!\n\nThis is a friendly reminder that your Camva Pro CRM subscription will expire in ${daysLeft} days (${formatDate(customer.expiry_date)}).\n\nTo avoid any interruption in service, please renew your subscription at your earliest convenience.\n\nIf you have any questions or need assistance, please don't hesitate to contact us.\n\nBest regards,\nCamva Pro Team`;
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Open Email
    const emailUrl = `mailto:${customer.email}?subject=Subscription Expiry Reminder - Camva Pro CRM&body=${encodeURIComponent(message)}`;
    window.open(emailUrl, '_blank');
    
    showToast('Reminder message links opened', 'success');
}

/**
 * Send general message to customer
 */
function sendMessage(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) return;
    
    const message = `Hello ${customer.name}!\n\nI hope you're doing well. This is a message from Camva Pro CRM team.\n\n[Please customize this message as needed]\n\nBest regards,\nCamva Pro Team`;
    
    // Open WhatsApp
    const whatsappUrl = `https://wa.me/${customer.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    // Open Email
    const emailUrl = `mailto:${customer.email}?subject=Message from Camva Pro CRM&body=${encodeURIComponent(message)}`;
    window.open(emailUrl, '_blank');
    
    showToast('Message links opened', 'success');
}

// ===============================================
// MAIN DATA LOADING & REFRESH
// ===============================================

/**
 * Load all data and update UI
 */
async function loadData() {
    try {
        allCustomers = await fetchCustomers();
        filteredCustomers = [...allCustomers];
        
        updateDashboardStats(allCustomers);
        filterCustomers(currentFilter); // Apply current filter
        
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load application data', 'error');
    }
}

/**
 * Refresh all data
 */
async function refreshData() {
    showToast('Refreshing data...', 'info', 2000);
    await loadData();
    showToast('Data refreshed successfully!', 'success');
}

// ===============================================
// EVENT LISTENERS & INITIALIZATION
// ===============================================

/**
 * Close modals when clicking outside
 */
document.addEventListener('click', (e) => {
    if (e.target === customerModal) {
        closeCustomerModal();
    }
    if (e.target === renewModal) {
        closeRenewModal();
    }
});

/**
 * Handle escape key to close modals
 */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (customerModal.classList.contains('show')) {
            closeCustomerModal();
        }
        if (renewModal.classList.contains('show')) {
            closeRenewModal();
        }
    }
});

/**
 * Handle search input changes
 */
searchInputEl.addEventListener('input', searchCustomers);

/**
 * Initialize application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Camva Pro CRM starting...');
    
    // Check if Supabase is available
    if (!window.supabase) {
        showToast('Supabase library not loaded. Please add Supabase CDN to your HTML.', 'error', 0);
        return;
    }
    
    // Load initial data
    await loadData();
    
    console.log('✅ Camva Pro CRM initialized successfully');
    showToast('Welcome to Camva Pro CRM!', 'success');
});

// ===============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ===============================================

// Make functions available globally for onclick handlers
window.showAddCustomerModal = showAddCustomerModal;
window.closeCustomerModal = closeCustomerModal;
window.editCustomer = editCustomer;
window.showRenewModal = showRenewModal;
window.closeRenewModal = closeRenewModal;
window.filterCustomers = filterCustomers;
window.searchCustomers = searchCustomers;
window.showExpiringCustomers = showExpiringCustomers;
window.refreshData = refreshData;
window.sendMessage = sendMessage;
window.sendReminderMessage = sendReminderMessage;
window.removeToast = removeToast;

console.log('📝 Camva Pro CRM script loaded');