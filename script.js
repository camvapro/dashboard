/**
 * script.js - Updated Camva Pro CRM with Message Templates & Total Amount
 * Enhanced customer management with professional messaging system
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
// MESSAGE TEMPLATES
// ===============================================

const MESSAGE_TEMPLATES = {
    welcome: {
        title: "Welcome Message",
        whatsapp: `🎉 Welcome to Camva Pro, {NAME}!

Your {PLAN} subscription is now active and ready to use.

✅ Plan: {PLAN}
📅 Valid Until: {EXPIRY_DATE}
💰 Full access to premium features

Start creating amazing designs now!

Need help? Contact us:
📱 WhatsApp: +91 6387617678

Thank you for choosing Camva Pro! 🚀`,
        email: {
            subject: "🎉 Welcome to Camva Pro!",
            body: `🎉 Welcome to Camva Pro, {NAME}!

Your {PLAN} subscription is now active and ready to use.

✅ Plan: {PLAN}
📅 Valid Until: {EXPIRY_DATE}
💰 Full access to premium features

Start creating amazing designs now!

Need help? Contact us:
📱 WhatsApp: +91 6387617678

Thank you for choosing Camva Pro! 🚀

Best regards,
Camva Pro Team
📱 +91 6387617678`
        }
    },
    
    subscriptionStart: {
        title: "Subscription Start",
        whatsapp: `🚀 Subscription Activated - {NAME}

Your Canva Pro {PLAN} subscription is now live!

📦 Plan: {PLAN}
📅 Valid Until: {EXPIRY_DATE}
✨ All premium features unlocked

Start designing with:
• Unlimited downloads
• Premium templates
• Background remover
• Advanced editing tools

Support: +91 6387617678`,
        email: {
            subject: "🚀 Your Canva Pro Subscription is Active",
            body: `🚀 Subscription Activated - {NAME}

Your Canva Pro {PLAN} subscription is now live!

📦 Plan: {PLAN}
📅 Valid Until: {EXPIRY_DATE}
✨ All premium features unlocked

Start designing with:
• Unlimited downloads
• Premium templates
• Background remover
• Advanced editing tools

Best regards,
Camva Pro Team
📱 +91 6387617678`
        }
    },
    
    renewal: {
        title: "Renewal Confirmation",
        whatsapp: `✅ Subscription Renewed Successfully! 

Hi {NAME}, great news! Your Camva Pro subscription has been renewed.

🔄 New Plan: {PLAN}
📅 Valid Until: {EXPIRY_DATE}
💎 Continued premium access

Thank you for staying with Camva Pro!

Questions? Contact us: +91 6387617678`,
        email: {
            subject: "✅ Canva Pro Subscription Renewed!",
            body: `✅ Subscription Renewed Successfully! 

Hi {NAME}, great news! Your Camva Pro subscription has been renewed.

🔄 New Plan: {PLAN}
📅 Valid Until: {EXPIRY_DATE}
💎 Continued premium access

Thank you for staying with Camva Pro!

Best regards,
Camva Pro Team
📱 +91 6387617678`
        }
    },
    
    reminder: {
        title: "Expiry Reminder",
        whatsapp: `⏰ Subscription Reminder - {NAME}

Your Canva Pro {PLAN} subscription expires in {DAYS_LEFT} days.

📅 Expiry Date: {EXPIRY_DATE}
📦 Current Plan: {PLAN}

Renew now to avoid service interruption!

Contact us to renew:
📱 WhatsApp: +91 6387617678
✉️ Email: support@camvapro.com`,
        email: {
            subject: "⏰ Canva Pro Subscription Reminder",
            body: `⏰ Subscription Reminder - {NAME}

Your Canva Pro {PLAN} subscription expires in {DAYS_LEFT} days.

📅 Expiry Date: {EXPIRY_DATE}
📦 Current Plan: {PLAN}

Renew now to avoid service interruption!

Contact us to renew:
📱 WhatsApp: +91 6387617678
✉️ Email: support@camvapro.com

Best regards,
Camva Pro Team
📱 +91 6387617678`
        }
    },
    
    expired: {
        title: "Subscription Expired",
        whatsapp: `⚠️ Subscription Expired - {NAME}

Your Canva Pro {PLAN} subscription has expired on {EXPIRY_DATE}.

📦 Previous Plan: {PLAN}
🚫 Premium features are now locked

Renew now to restore full access:
• All premium templates
• Advanced editing tools
• Unlimited downloads

Contact us: +91 6387617678`,
        email: {
            subject: "⚠️ Canva Pro Subscription Expired",
            body: `⚠️ Subscription Expired - {NAME}

Your Canva Pro {PLAN} subscription has expired on {EXPIRY_DATE}.

📦 Previous Plan: {PLAN}
🚫 Premium features are now locked

Renew now to restore full access:
• All premium templates
• Advanced editing tools
• Unlimited downloads

Best regards,
Camva Pro Team
📱 +91 6387617678`
        }
    },
    
    status: {
        title: "Status Update",
        whatsapp: `Hi {NAME}! 

Your Canva Pro {PLAN} subscription status update:

✅ Account: {STATUS}
📦 Plan: {PLAN}
🎨 Access: All premium features

Need help? Contact us: +91 6387617678

Best regards,
Camva Pro Team 🚀`,
        email: {
            subject: "🚦 Your Canva Pro Subscription Status",
            body: `Hi {NAME}! 

Your Canva Pro {PLAN} subscription status update:

✅ Account: {STATUS}
📦 Plan: {PLAN}
🎨 Access: All premium features

Need help? Contact us: +91 6387617678

Best regards,
Camva Pro Team 🚀`
        }
    }
};

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
            .order('id', { ascending: false });
        
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
                total_amount: customerData.payment_amount || 0, // Initialize total_amount
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
 * Renew customer subscription with total_amount update
 */
async function renewSubscription(customerId, renewalData) {
    try {
        showLoadingOverlay(true);
        
        // First get the current customer data
        const { data: currentCustomer, error: fetchError } = await supabaseClient
            .from('customers')
            .select('total_amount')
            .eq('id', customerId)
            .single();
        
        if (fetchError) {
            throw new Error('Failed to fetch current customer data');
        }
        
        // Calculate new total amount
        const currentTotal = parseFloat(currentCustomer?.total_amount) || 0;
        const newTotal = currentTotal + parseFloat(renewalData.payment_amount);
        
        const { data, error } = await supabaseClient
            .from('customers')
            .update({
                expiry_date: renewalData.expiry_date,
                payment_amount: renewalData.payment_amount,
                total_amount: newTotal, // Updated total amount
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
    
    // Total revenue from all customers (using total_amount)
    const totalRevenue = customers.reduce((sum, c) => sum + (parseFloat(c.total_amount) || 0), 0);
    
    // Update DOM elements
    totalCustomersEl.textContent = totalCustomers;
    activeSubscriptionsEl.textContent = activeSubscriptions;
    expiringThisWeekEl.textContent = expiringThisWeek;
    totalRevenueEl.textContent = formatCurrency(totalRevenue);
}

// ===============================================
// MESSAGE SYSTEM
// ===============================================

/**
 * Replace template variables with customer data
 */
function replaceMessageVariables(template, customer) {
    const today = getTodayDate();
    const daysLeft = customer.expiry_date ? daysDifference(today, customer.expiry_date) : 0;
    
    return template
        .replace(/{NAME}/g, customer.name || '')
        .replace(/{PLAN}/g, customer.plan_type || 'Monthly')
        .replace(/{EXPIRY_DATE}/g, formatDate(customer.expiry_date))
        .replace(/{STATUS}/g, (customer.status || 'active').toUpperCase())
        .replace(/{DAYS_LEFT}/g, daysLeft.toString())
        .replace(/{PHONE}/g, customer.phone || '')
        .replace(/{EMAIL}/g, customer.email || '');
}

/**
 * Send message via WhatsApp
 */
function sendWhatsAppMessage(phone, message) {
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

/**
 * Send message via Email
 */
function sendEmailMessage(email, subject, body) {
    const emailUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl, '_blank');
}

/**
 * Show message dropdown for customer
 */
function showMessageDropdown(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    if (!customer) {
        showToast('Customer not found', 'error');
        return;
    }
    
    // Create dropdown HTML
    const dropdownHtml = `
        <div class="message-dropdown-overlay" onclick="closeMessageDropdown()">
            <div class="message-dropdown" onclick="event.stopPropagation()">
                <div class="message-dropdown-header">
                    <h4>Send Message to ${customer.name}</h4>
                    <button onclick="closeMessageDropdown()">&times;</button>
                </div>
                
                <div class="message-dropdown-content">
                    <div class="message-type-selection">
                        <label>Select Message Type:</label>
                        <select id="messageTypeSelect" onchange="updateMessagePreview('${customerId}')">
                            <option value="welcome">Welcome Message</option>
                            <option value="subscriptionStart">Subscription Start</option>
                            <option value="renewal">Renewal Confirmation</option>
                            <option value="reminder">Expiry Reminder</option>
                            <option value="expired">Subscription Expired</option>
                            <option value="status">Status Update</option>
                        </select>
                    </div>
                    
                    <div class="message-preview">
                        <label>Message Preview:</label>
                        <textarea id="messagePreview" rows="8" readonly></textarea>
                    </div>
                    
                    <div class="message-actions">
                        <button class="btn btn-success" onclick="sendSelectedWhatsApp('${customerId}')">
                            <i class="fab fa-whatsapp"></i> Send WhatsApp
                        </button>
                        <button class="btn btn-primary" onclick="sendSelectedEmail('${customerId}')">
                            <i class="fas fa-envelope"></i> Send Email
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add to body
    const dropdownEl = document.createElement('div');
    dropdownEl.innerHTML = dropdownHtml;
    document.body.appendChild(dropdownEl);
    
    // Initialize with first option
    updateMessagePreview(customerId);
}

/**
 * Update message preview based on selected type
 */
function updateMessagePreview(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    const messageType = document.getElementById('messageTypeSelect').value;
    const template = MESSAGE_TEMPLATES[messageType];
    
    if (template && customer) {
        const message = replaceMessageVariables(template.whatsapp, customer);
        document.getElementById('messagePreview').value = message;
    }
}

/**
 * Send selected WhatsApp message
 */
function sendSelectedWhatsApp(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    const messageType = document.getElementById('messageTypeSelect').value;
    const template = MESSAGE_TEMPLATES[messageType];
    
    if (template && customer) {
        const message = replaceMessageVariables(template.whatsapp, customer);
        sendWhatsAppMessage(customer.phone, message);
        showToast(`WhatsApp message opened for ${customer.name}`, 'success');
        closeMessageDropdown();
    }
}

/**
 * Send selected Email message
 */
function sendSelectedEmail(customerId) {
    const customer = allCustomers.find(c => c.id === customerId);
    const messageType = document.getElementById('messageTypeSelect').value;
    const template = MESSAGE_TEMPLATES[messageType];
    
    if (template && customer) {
        const subject = template.email.subject;
        const body = replaceMessageVariables(template.email.body, customer);
        sendEmailMessage(customer.email, subject, body);
        showToast(`Email opened for ${customer.name}`, 'success');
        closeMessageDropdown();
    }
}

/**
 * Close message dropdown
 */
function closeMessageDropdown() {
    const dropdown = document.querySelector('.message-dropdown-overlay');
    if (dropdown) {
        dropdown.remove();
    }
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
                <span class="detail-label">Last Payment:</span>
                <span class="detail-value">${customer.payment_amount ? formatCurrency(customer.payment_amount) : '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Paid:</span>
                <span class="detail-value">${customer.total_amount ? formatCurrency(customer.total_amount) : '-'}</span>
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
            <button class="btn btn-sm btn-info" onclick="showMessageDropdown('${customer.id}')">
                <i class="fas fa-paper-plane"></i> Message
            </button>
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
            <span class="detail-label">Total Paid:</span>
            <span class="detail-value">${formatCurrency(customer.total_amount || 0)}</span>
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
    
    const customerData = {
        name: document.getElementById('customerName').value,
        email: document.getElementById('customerEmail').value,
        phone: document.getElementById('customerPhone').value,
        company: document.getElementById('customerCompany') ? document.getElementById('customerCompany').value : '',
        team: document.getElementById('customerTeam').value,
        plan_type: document.getElementById('planType').value,
        payment_amount: parseFloat(document.getElementById('planAmount').value) || 0,
        join_date: document.getElementById('joinDate').value,
        expiry_date: document.getElementById('expiryDate').value,
        notes: document.getElementById('customerNotes').value
        // Remove send_welcome from here
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
        
        // Auto-send welcome message for new customers
        if (!currentEditingCustomer) {
            setTimeout(() => {
                showMessageDropdown(result.id);
            }, 500);
        }
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
        notes: document.getElementById('renewalNotes').value
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
        
        // Auto-show renewal message
        setTimeout(() => {
            showMessageDropdown(customerId);
            document.getElementById('messageTypeSelect').value = 'renewal';
            updateMessagePreview(customerId);
        }, 500);
    }
});

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
        if (document.querySelector('.message-dropdown-overlay')) {
            closeMessageDropdown();
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
window.removeToast = removeToast;
window.showMessageDropdown = showMessageDropdown;
window.closeMessageDropdown = closeMessageDropdown;
window.updateMessagePreview = updateMessagePreview;
window.sendSelectedWhatsApp = sendSelectedWhatsApp;
window.sendSelectedEmail = sendSelectedEmail;

console.log('📝 Camva Pro CRM script loaded');