// API Base URL
const API_BASE_URL = window.location.origin;

// Global state
let cart = [];
let foods = [];
let orders = [];
let users = [];
let currentUser = null;
let authToken = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing authentication
    checkExistingAuth();
    
    // Load persisted cart data
    loadPersistedCart();
    
    loadFoods();
    updateCartDisplay();
    
    // Handle initial page load based on URL
    handleInitialRoute();
    
    // Setup profile dropdown and cart functionality
    setupProfileDropdown();
    setupCartRipple();
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.section) {
            showSection(event.state.section, false);
        } else {
            // Default to home if no state
            showSection('home', false);
        }
    });
    
    // Add event listeners for navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            
            // Check authentication for protected sections
            if ((targetSection === 'orders' || targetSection === 'admin') && !authToken) {
                showNotification('Please login to access this section', true);
                window.location.href = 'login.html';
                return;
            }
            
            // Check admin access
            if (targetSection === 'admin' && (!currentUser || currentUser.role !== 'ADMIN')) {
                showNotification('Admin access required', true);
                return;
            }
            
            showSection(targetSection, true);
            
            // Update active nav link
            updateActiveNavLink(targetSection);
        });
    });
});

// Handle initial route based on URL hash
function handleInitialRoute() {
    const hash = window.location.hash.substring(1);
    const validSections = ['home', 'menu', 'orders', 'admin'];
    
    if (hash && validSections.includes(hash)) {
        showSection(hash, false);
        updateActiveNavLink(hash);
    } else {
        showSection('home', false);
        updateActiveNavLink('home');
    }
}

// Update active navigation link
function updateActiveNavLink(section) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `${section}`) {
            link.classList.add('active');
        }
    });
}

// Navigation Functions
function showSection(sectionName, updateHistory = true) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        
        // Update URL hash and browser history
        if (updateHistory) {
            const newUrl = `${window.location.pathname}#${sectionName}`;
            history.pushState({ section: sectionName }, '', newUrl);
        }
        
        // Update page title
        document.title = `Food Order App - ${sectionName.charAt(0).toUpperCase() + sectionName.slice(1)}`;
        
        // Load data based on section
        switch(sectionName) {
            case 'menu':
                loadFoods();
                break;
            case 'orders':
                loadOrderHistory();
                updateCheckoutDisplay();
                break;
            case 'admin':
                loadAdminData();
                break;
            case 'home':
                document.title = 'Food Order App - Delicious Food Delivered Fast';
                break;
        }
    }
}

// Utility Functions
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.add('active');
    }
}

function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.classList.remove('active');
    }
}

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.toggle('error', isError);
    notification.classList.add('active');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    document.getElementById('notification').classList.remove('active');
}

// Authentication Functions
function checkExistingAuth() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('currentUser');
    const userSession = localStorage.getItem('userSession');
    
    // Validate session integrity
    if (token && user && userSession) {
        try {
            const userData = JSON.parse(user);
            const sessionData = JSON.parse(userSession);
            const now = new Date();
            const expiresAt = new Date(sessionData.expiresAt);
            
            // Check session expiry
            if (now > expiresAt) {
                clearAuthData();
                showNotification('Session expired. Please login again.', true);
                updateAuthUI();
                return;
            }
            
            // Validate data consistency
            if (sessionData.username !== userData.username || sessionData.role !== userData.role) {
                clearAuthData();
                showNotification('Session corrupted. Please login again.', true);
                updateAuthUI();
                return;
            }
            
            authToken = token;
            currentUser = userData;
            
            // Merge guest cart with user cart after login
            mergeGuestCartWithUserCart();
            
            // Check for new authentication
            const authSuccess = sessionStorage.getItem('authenticationSuccess');
            if (authSuccess) {
                const isNewUser = userData.isNewUser || false;
                const welcomeMessage = isNewUser 
                    ? `Welcome to FoodOrder, ${userData.username}! ${userData.role === 'ADMIN' ? 'You have admin access.' : 'Start exploring our delicious menu!'}`
                    : `Welcome back, ${userData.username}! ${userData.role === 'ADMIN' ? 'Admin dashboard ready.' : 'Ready to order?'}`;
                
                showNotification(welcomeMessage);
                sessionStorage.removeItem('authenticationSuccess');
                
                // Remove new user flag after first login
                if (isNewUser) {
                    userData.isNewUser = false;
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                }
            }
            
            updateAuthUI();
        } catch (error) {
            console.error('Auth validation error:', error);
            clearAuthData();
            updateAuthUI();
        }
    } else {
        updateAuthUI();
    }
}

function clearAuthData() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('authenticationSuccess');
}

function updateAuthUI() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const ordersLink = document.getElementById('ordersLink');
    const adminLink = document.getElementById('adminLink');
    const adminMenuControls = document.getElementById('adminMenuControls');
    
    if (authToken && currentUser) {
        // User is logged in
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'block';
            updateProfileInfo(currentUser.username, currentUser.role);
        }
        
        // Show orders link for all authenticated users
        if (ordersLink) ordersLink.style.display = 'block';
        
        // Show admin link only for admin users
        if (adminLink) {
            if (currentUser.role === 'ADMIN') {
                adminLink.style.display = 'block';
            } else {
                adminLink.style.display = 'none';
            }
        }
        
        // Show admin menu controls only for admin users
        if (adminMenuControls) {
            if (currentUser.role === 'ADMIN') {
                adminMenuControls.style.display = 'block';
            } else {
                adminMenuControls.style.display = 'none';
            }
        }
    } else {
        // User is not logged in
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
        if (ordersLink) ordersLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (adminMenuControls) adminMenuControls.style.display = 'none';
    }
}

function updateProfileInfo(username, role) {
    const profileName = document.getElementById('profileName');
    const profileRole = document.getElementById('profileRole');
    const dropdownName = document.getElementById('dropdownName');
    const dropdownEmail = document.getElementById('dropdownEmail');
    const dropdownRoleBadge = document.getElementById('dropdownRoleBadge');
    const profileAvatar = document.querySelector('.profile-avatar');
    const dropdownAvatar = document.querySelector('.dropdown-avatar');
    
    // Update profile trigger
    if (profileName) profileName.textContent = username;
    if (profileRole) profileRole.textContent = role;
    
    // Update dropdown header
    if (dropdownName) dropdownName.textContent = username;
    if (dropdownEmail) dropdownEmail.textContent = `${username.toLowerCase()}@foodapp.com`;
    if (dropdownRoleBadge) dropdownRoleBadge.textContent = role;
    
    // Update avatars with first letter
    const firstLetter = username.charAt(0).toUpperCase();
    if (profileAvatar) profileAvatar.textContent = firstLetter;
    if (dropdownAvatar) dropdownAvatar.textContent = firstLetter;
}

function logout() {
    const userName = currentUser ? currentUser.username : 'User';
    
    // Save current cart as guest cart before logout
    if (cart.length > 0) {
        localStorage.setItem('cart_guest', JSON.stringify(cart));
    }
    
    clearAuthData();
    updateAuthUI();
    showSection('home', true);
    updateActiveNavLink('home');
    
    showNotification(`Goodbye ${userName}! You've been logged out successfully. Your cart has been preserved.`);
    
    // Keep cart for guest browsing - don't clear it
    updateCartDisplay();
}

// Make logout globally accessible
window.logout = logout;

// API Functions
async function apiCall(endpoint, options = {}) {
    showLoading();
    try {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add JWT token to authorization header if available
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: headers,
            ...options
        });
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            try {
                const errorData = await response.text();
                if (errorData) {
                    // Try to parse as JSON for structured error messages
                    try {
                        const errorJson = JSON.parse(errorData);
                        if (errorJson.error) {
                            errorMessage = errorJson.error;
                        } else if (errorJson.message) {
                            errorMessage = errorJson.message;
                        } else {
                            errorMessage += `: ${errorData}`;
                        }
                    } catch (parseError) {
                        // If not JSON, use as plain text
                        errorMessage += `: ${errorData}`;
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
            throw new Error(errorMessage);
        }
        
        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        } else {
            const text = await response.text();
            return text ? JSON.parse(text) : {};
        }
    } catch (error) {
        console.error('API call failed:', error);
        if (!error.message.includes('HTTP')) {
            showNotification(`Connection Error: Please check if the server is running`, true);
        }
        throw error;
    } finally {
        hideLoading();
    }
}

// Food Management Functions
async function loadFoods() {
    try {
        foods = await apiCall('/foods');
        displayFoods();
        displayAdminFoods();
    } catch (error) {
        console.error('Failed to load foods:', error);
    }
}

function displayFoods() {
    const menuItems = document.getElementById('menuItems');
    if (!menuItems) return;
    
    menuItems.innerHTML = '';
    
    // Add a notice for guest users
    if (!authToken || !currentUser) {
        const guestNotice = document.createElement('div');
        guestNotice.className = 'guest-notice';
        guestNotice.innerHTML = `
            <div class="notice-content">
                <i class="fas fa-info-circle"></i>
                <span>You can browse and add items to cart. <strong><a href="login.html">Login</a></strong> required to place orders.</span>
            </div>
        `;
        menuItems.appendChild(guestNotice);
    }
    
    foods.forEach(food => {
        const foodCard = document.createElement('div');
        foodCard.className = 'menu-item';
        foodCard.setAttribute('data-category', food.category || '');
        foodCard.setAttribute('data-price', food.price);
        
        // Format category for display
        const categoryDisplay = food.category ? food.category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '';
        
        foodCard.innerHTML = `
            <div class="menu-item-header">
                <h3>${food.name}</h3>
                ${categoryDisplay ? `<span class="category-badge">${categoryDisplay}</span>` : ''}
            </div>
            <div class="price">₹${food.price.toFixed(2)}</div>
            <div class="description">${food.description}</div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="changeQuantity(${food.id}, -1)">-</button>
                <span class="quantity-display" id="qty-${food.id}">1</span>
                <button class="quantity-btn" onclick="changeQuantity(${food.id}, 1)">+</button>
            </div>
            <div class="menu-item-actions">
                <button class="btn btn-primary" onclick="addToCart(${food.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        `;
        menuItems.appendChild(foodCard);
    });
}

function displayAdminFoods() {
    const adminFoodList = document.getElementById('adminFoodList');
    if (!adminFoodList) return;
    
    adminFoodList.innerHTML = '';
    
    foods.forEach(food => {
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        adminItem.innerHTML = `
            <div class="admin-item-info">
                <h4>${food.name}</h4>
                <p>Price: ₹${food.price.toFixed(2)}</p>
                <p>${food.description}</p>
                <small class="delete-info">
                    <i class="fas fa-info-circle"></i> 
                    Can be deleted only when all orders are delivered/cancelled
                </small>
            </div>
            <div class="admin-item-actions">
                <button class="btn btn-warning" onclick="editFood(${food.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deleteFood(${food.id})" 
                        title="Delete (only if no active orders)">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        adminFoodList.appendChild(adminItem);
    });
}

function changeQuantity(foodId, change) {
    const qtyDisplay = document.getElementById(`qty-${foodId}`);
    let currentQty = parseInt(qtyDisplay.textContent);
    currentQty = Math.max(1, currentQty + change);
    qtyDisplay.textContent = currentQty;
}

function addToCart(foodId) {
    const food = foods.find(f => f.id === foodId);
    const qtyDisplay = document.getElementById(`qty-${foodId}`);
    const quantity = parseInt(qtyDisplay.textContent);
    
    if (food) {
        const existingItem = cart.find(item => item.foodId === foodId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.push({
                foodId: foodId,
                name: food.name,
                price: food.price,
                quantity: quantity
            });
        }
        
        // Persist cart to localStorage for both logged in and guest users
        persistCart();
        
        updateCartDisplay();
        showNotification(`${food.name} added to cart!`);
        
        // Reset quantity to 1
        qtyDisplay.textContent = '1';
    }
}

function removeFromCart(foodId) {
    cart = cart.filter(item => item.foodId !== foodId);
    persistCart();
    updateCartDisplay();
    updateCheckoutDisplay();
}

function updateCartItemQuantity(foodId, newQuantity) {
    const item = cart.find(item => item.foodId === foodId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(foodId);
        } else {
            item.quantity = newQuantity;
            persistCart();
            updateCartDisplay();
            updateCheckoutDisplay();
        }
    }
}

function updateCartDisplay() {
    // Update cart count
    const cartCount = document.querySelector('.cart-count');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart sidebar
    const cartItemsList = document.getElementById('cartItemsList');
    if (cartItemsList) {
        cartItemsList.innerHTML = '';
        
        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p>Your cart is empty</p>';
        } else {
            // Add login prompt for guest users with items in cart
            if (!authToken || !currentUser) {
                const loginPrompt = document.createElement('div');
                loginPrompt.className = 'cart-login-prompt';
                loginPrompt.innerHTML = `
                    <div class="login-prompt-content">
                        <i class="fas fa-user-lock"></i>
                        <p>Please <a href="login.html" class="login-link">login</a> to checkout</p>
                        <small>Your cart will be preserved</small>
                    </div>
                `;
                cartItemsList.appendChild(loginPrompt);
            }
            
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <div>
                        <h4>${item.name}</h4>
                        <div class="quantity-controls">
                            <button class="quantity-btn" onclick="updateCartItemQuantity(${item.foodId}, ${item.quantity - 1})">-</button>
                            <span class="quantity-display">${item.quantity}</span>
                            <button class="quantity-btn" onclick="updateCartItemQuantity(${item.foodId}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <div>
                        <div>₹${(item.price * item.quantity).toFixed(2)}</div>
                        <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.foodId})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                cartItemsList.appendChild(cartItem);
            });
        }
    }
    
    // Update cart total
    const cartTotal = document.getElementById('cartTotal');
    if (cartTotal) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = total.toFixed(2);
    }
}

function updateCheckoutDisplay() {
    const cartItems = document.getElementById('cartItems');
    const totalAmount = document.getElementById('totalAmount');
    
    if (cartItems) {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>No items in cart. Add some items from the menu first.</p>';
        } else {
            cart.forEach(item => {
                const cartItem = document.createElement('div');
                cartItem.className = 'cart-item';
                cartItem.innerHTML = `
                    <span>${item.name} x ${item.quantity}</span>
                    <span>₹${(item.price * item.quantity).toFixed(2)}</span>
                `;
                cartItems.appendChild(cartItem);
            });
        }
    }
    
    if (totalAmount) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalAmount.textContent = total.toFixed(2);
    }
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('active');
}

function clearCart() {
    cart = [];
    persistCart();
    updateCartDisplay();
    updateCheckoutDisplay();
    showNotification('Cart cleared!');
}

// Cart Persistence Functions
function persistCart() {
    try {
        // Use a unique key for cart storage
        const cartKey = authToken ? `cart_${currentUser?.username || 'user'}` : 'cart_guest';
        localStorage.setItem(cartKey, JSON.stringify(cart));
        
        // Also maintain a backup in case of user switching
        localStorage.setItem('currentCart', JSON.stringify(cart));
    } catch (error) {
        console.error('Failed to persist cart:', error);
    }
}

function loadPersistedCart() {
    try {
        // Determine which cart to load
        const cartKey = authToken ? `cart_${currentUser?.username || 'user'}` : 'cart_guest';
        const persistedCart = localStorage.getItem(cartKey) || localStorage.getItem('currentCart');
        
        if (persistedCart) {
            const parsedCart = JSON.parse(persistedCart);
            // Validate cart structure
            if (Array.isArray(parsedCart)) {
                cart = parsedCart.filter(item => 
                    item.foodId && item.name && typeof item.price === 'number' && item.quantity > 0
                );
            }
        }
    } catch (error) {
        console.error('Failed to load persisted cart:', error);
        cart = [];
    }
}

function mergeGuestCartWithUserCart() {
    try {
        const guestCart = localStorage.getItem('cart_guest');
        const userCartKey = `cart_${currentUser?.username}`;
        const userCart = localStorage.getItem(userCartKey);
        
        if (guestCart && currentUser) {
            const guestItems = JSON.parse(guestCart);
            const userItems = userCart ? JSON.parse(userCart) : [];
            
            // Merge carts, combining quantities for same items
            const mergedCart = [...userItems];
            
            guestItems.forEach(guestItem => {
                const existingItem = mergedCart.find(item => item.foodId === guestItem.foodId);
                if (existingItem) {
                    existingItem.quantity += guestItem.quantity;
                } else {
                    mergedCart.push(guestItem);
                }
            });
            
            cart = mergedCart;
            persistCart();
            
            // Clear guest cart after merge
            localStorage.removeItem('cart_guest');
            
            if (guestItems.length > 0) {
                showNotification(`Welcome back! Your cart has been restored with ${guestItems.length} item(s).`);
            }
        }
    } catch (error) {
        console.error('Failed to merge carts:', error);
    }
}

function goToCheckout() {
    // Check if cart has items
    if (cart.length === 0) {
        showNotification('Your cart is empty. Please add some items first!', true);
        toggleCart();
        return;
    }
    
    // Check if user is authenticated
    if (!authToken || !currentUser) {
        showNotification('Please login to proceed to checkout', true);
        persistCart(); // Save cart before redirect
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    // Proceed to checkout if authenticated
    toggleCart();
    showSection('orders', true);
    updateActiveNavLink('orders');
    showOrderTab('checkout');
}

// Search and Filter Functionality
function searchFoods() {
    applyAllFilters();
}

function filterByCategory() {
    applyAllFilters();
}

function filterByPrice() {
    applyAllFilters();
}

function applyAllFilters() {
    const searchTerm = document.getElementById('searchFood').value.toLowerCase();
    const selectedCategory = document.getElementById('categoryFilter').value;
    const selectedPriceRange = document.getElementById('priceFilter').value;
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        // Skip guest notice if present
        if (item.classList.contains('guest-notice')) return;
        
        // Search filter
        const name = item.querySelector('h3').textContent.toLowerCase();
        const description = item.querySelector('.description').textContent.toLowerCase();
        const matchesSearch = searchTerm === '' || name.includes(searchTerm) || description.includes(searchTerm);
        
        // Category filter
        const itemCategory = item.getAttribute('data-category') || '';
        const matchesCategory = selectedCategory === '' || itemCategory === selectedCategory;
        
        // Price filter
        let matchesPrice = true;
        if (selectedPriceRange !== '') {
            const price = parseFloat(item.getAttribute('data-price') || '0');
            switch (selectedPriceRange) {
                case 'under-100':
                    matchesPrice = price < 100;
                    break;
                case '100-200':
                    matchesPrice = price >= 100 && price <= 200;
                    break;
                case '200-300':
                    matchesPrice = price >= 200 && price <= 300;
                    break;
                case 'above-300':
                    matchesPrice = price > 300;
                    break;
            }
        }
        
        // Show/hide item based on all filters
        if (matchesSearch && matchesCategory && matchesPrice) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function clearAllFilters() {
    document.getElementById('searchFood').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('priceFilter').value = '';
    applyAllFilters();
}

// Food Modal Functions
function showAddFoodForm() {
    document.getElementById('foodModalTitle').textContent = 'Add New Food Item';
    document.getElementById('foodForm').reset();
    document.getElementById('foodId').value = '';
    document.getElementById('foodModal').classList.add('active');
    
    // Reset character counter
    const charCount = document.getElementById('descCharCount');
    if (charCount) {
        charCount.textContent = '0';
        charCount.style.color = '#e74c3c';
    }
    
    // Setup character counter if not already done
    setupDescriptionCounter();
}

function editFood(foodId) {
    const food = foods.find(f => f.id === foodId);
    if (food) {
        document.getElementById('foodModalTitle').textContent = 'Edit Food Item';
        document.getElementById('foodId').value = food.id;
        document.getElementById('foodName').value = food.name;
        document.getElementById('foodPrice').value = food.price;
        document.getElementById('foodDescription').value = food.description;
        document.getElementById('foodModal').classList.add('active');
        
        // Update character counter for existing description
        const charCount = document.getElementById('descCharCount');
        if (charCount) {
            charCount.textContent = food.description.length;
            const length = food.description.length;
            if (length < 5) {
                charCount.style.color = '#e74c3c';
            } else if (length > 180) {
                charCount.style.color = '#f39c12';
            } else {
                charCount.style.color = '#27ae60';
            }
        }
        
        // Setup character counter if not already done
        setupDescriptionCounter();
    }
}

function closeFoodModal() {
    document.getElementById('foodModal').classList.remove('active');
}

// Validation function for food items
function validateFoodForm() {
    const name = document.getElementById('foodName').value.trim();
    const price = parseFloat(document.getElementById('foodPrice').value);
    const description = document.getElementById('foodDescription').value.trim();
    
    // Validate name
    if (!name || name.length < 2 || name.length > 50) {
        throw new Error('Food name must be between 2 and 50 characters');
    }
    
    // Validate price
    if (isNaN(price) || price < 1 || price > 10000) {
        throw new Error('Price must be between ₹1 and ₹10,000');
    }
    
    // Validate description
    if (!description || description.length < 5 || description.length > 200) {
        throw new Error('Description must be between 5 and 200 characters');
    }
    
    return { name, price, description };
}

async function saveFoodItem(event) {
    event.preventDefault();
    
    const foodId = document.getElementById('foodId').value;
    
    try {
        // Validate form data
        const foodData = validateFoodForm();
        if (foodId) {
            // Update existing food
            await apiCall(`/foods/${foodId}`, {
                method: 'PUT',
                body: JSON.stringify(foodData)
            });
            showNotification('Food item updated successfully!');
        } else {
            // Create new food
            await apiCall('/foods', {
                method: 'POST',
                body: JSON.stringify(foodData)
            });
            showNotification('Food item added successfully!');
        }
        
        closeFoodModal();
        loadFoods();
    } catch (error) {
        console.error('Save food error:', error);
        showNotification(error.message || 'Failed to save food item', true);
    }
}

// Add real-time character counter for description
function setupDescriptionCounter() {
    const descriptionField = document.getElementById('foodDescription');
    const charCount = document.getElementById('descCharCount');
    
    if (descriptionField && charCount) {
        descriptionField.addEventListener('input', function() {
            const length = this.value.length;
            charCount.textContent = length;
            
            // Color code based on validation
            if (length < 5) {
                charCount.style.color = '#e74c3c'; // Red for too short
            } else if (length > 180) {
                charCount.style.color = '#f39c12'; // Orange for approaching limit
            } else {
                charCount.style.color = '#27ae60'; // Green for valid
            }
        });
    }
}

async function deleteFood(foodId) {
    const food = foods.find(f => f.id === foodId);
    const foodName = food ? food.name : 'this food item';
    
    if (confirm(`Are you sure you want to delete "${foodName}"? This action cannot be undone.`)) {
        try {
            await apiCall(`/foods/${foodId}`, { method: 'DELETE' });
            showNotification(`${foodName} deleted successfully!`);
            loadFoods();
        } catch (error) {
            console.error('Delete food error:', error);
            
            // Check specific error types
            if (error.message && error.message.includes('pending or active orders')) {
                showNotification(error.message, true);
            } else if (error.message && error.message.includes('foreign key constraint')) {
                showNotification(
                    `Cannot delete "${foodName}" because it has been ordered by customers. Please contact support if you need to remove this item.`, 
                    true
                );
            } else if (error.message && error.message.includes('constraint')) {
                showNotification(
                    `Cannot delete "${foodName}" because it is currently being used in existing orders.`, 
                    true
                );
            } else {
                showNotification(`Failed to delete "${foodName}". Please try again.`, true);
            }
        }
    }
}

// Order Functions
async function checkout(event) {
    event.preventDefault();
    
    // Check if user is authenticated
    if (!authToken || !currentUser) {
        showNotification('Please login to place your order', true);
        // Store current cart before redirecting
        persistCart();
        // Show login modal or redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    if (cart.length === 0) {
        showNotification('Please add items to cart before checkout', true);
        return;
    }
    
    // Use the logged-in user's name as default or allow override
    let customerName = document.getElementById('customerName').value.trim();
    if (!customerName) {
        customerName = currentUser.username;
        document.getElementById('customerName').value = customerName;
    }
    
    const orderData = {
        customerName: customerName,
        items: cart.map(item => ({
            foodId: item.foodId,
            quantity: item.quantity
        }))
    };
    
    try {
        const response = await apiCall('/orders/checkout', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        
        showNotification(`Order placed successfully! Order ID: ${response.orderId || response.id || 'Unknown'}`);
        
        // Clear cart after successful order
        cart = [];
        persistCart();
        updateCartDisplay();
        updateCheckoutDisplay();
        document.getElementById('checkoutForm').reset();
        loadOrderHistory();
    } catch (error) {
        showNotification('Failed to place order. Please try again.', true);
        console.error('Checkout error:', error);
    }
}

async function loadOrderHistory() {
    try {
        orders = await apiCall('/orders');
        displayOrderHistory();
        displayAdminOrders();
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

function displayOrderHistory() {
    const orderHistory = document.getElementById('orderHistory');
    if (!orderHistory) return;
    
    orderHistory.innerHTML = '';
    
    if (orders.length === 0) {
        orderHistory.innerHTML = '<p>No orders found.</p>';
        return;
    }
    
    orders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        const itemsList = order.items.map(item => 
            `<div>${item.foodName} x ${item.quantity} - ₹${item.price.toFixed(2)}</div>`
        ).join('');
        
        orderItem.innerHTML = `
            <div class="order-header">
                <div class="order-id">Order #${order.orderId}</div>
                <div class="order-status ${order.status.toLowerCase()}">${order.status}</div>
            </div>
            <div><strong>Customer:</strong> ${order.customerName}</div>
            <div class="order-items">
                <strong>Items:</strong>
                ${itemsList}
            </div>
            <div class="order-total">Total: ₹${order.totalPrice.toFixed(2)}</div>
        `;
        orderHistory.appendChild(orderItem);
    });
}

function displayAdminOrders() {
    const adminOrderList = document.getElementById('adminOrderList');
    if (!adminOrderList) return;
    
    adminOrderList.innerHTML = '';
    
    orders.forEach(order => {
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        
        const itemsList = order.items.map(item => 
            `${item.foodName} x ${item.quantity}`
        ).join(', ');
        
        adminItem.innerHTML = `
            <div class="admin-item-info">
                <h4>Order #${order.orderId} - ${order.customerName}</h4>
                <p>Items: ${itemsList}</p>
                <p>Total: ₹${order.totalPrice.toFixed(2)}</p>
                <p>Status: <span class="order-status ${order.status.toLowerCase()}">${order.status}</span></p>
            </div>
            <div class="admin-item-actions">
                <select onchange="updateOrderStatus(${order.orderId}, this.value)" value="${order.status}">
                    <option value="PENDING" ${order.status === 'PENDING' ? 'selected' : ''}>Pending</option>
                    <option value="CONFIRMED" ${order.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
                    <option value="PREPARING" ${order.status === 'PREPARING' ? 'selected' : ''}>Preparing</option>
                    <option value="DELIVERED" ${order.status === 'DELIVERED' ? 'selected' : ''}>Delivered</option>
                    <option value="CANCELLED" ${order.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
                </select>
                <button class="btn btn-danger" onclick="deleteOrder(${order.orderId})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        adminOrderList.appendChild(adminItem);
    });
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await apiCall(`/orders/${orderId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        showNotification('Order status updated successfully!');
        loadOrderHistory();
    } catch (error) {
        showNotification('Failed to update order status', true);
    }
}

async function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
        try {
            await apiCall(`/orders/${orderId}`, { method: 'DELETE' });
            showNotification('Order deleted successfully!');
            loadOrderHistory();
        } catch (error) {
            showNotification('Failed to delete order', true);
        }
    }
}

// User Functions
async function loadUsers() {
    try {
        users = await apiCall('/users');
        displayAdminUsers();
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

function displayAdminUsers() {
    const adminUserList = document.getElementById('adminUserList');
    if (!adminUserList) return;
    
    adminUserList.innerHTML = '';
    
    users.forEach(user => {
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        adminItem.innerHTML = `
            <div class="admin-item-info">
                <h4>${user.username}</h4>
                <p>Email: ${user.email}</p>
                <p>Role: ${user.role}</p>
            </div>
        `;
        adminUserList.appendChild(adminItem);
    });
}

function showAddUserForm() {
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

async function saveUser(event) {
    event.preventDefault();
    
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        role: document.getElementById('role').value
    };
    
    try {
        await apiCall('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        showNotification('User created successfully!');
        closeUserModal();
        document.getElementById('userForm').reset();
        loadUsers();
    } catch (error) {
        showNotification('Failed to create user', true);
    }
}

// Tab Functions
function showOrderTab(tabName) {
    // Hide all order tabs
    document.querySelectorAll('#orders .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Update tab buttons
    document.querySelectorAll('#orders .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(tabName)) {
            btn.classList.add('active');
        }
    });
}

function showAdminTab(tabName) {
    // Hide all admin tabs
    document.querySelectorAll('#admin .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`${tabName}-admin-tab`).classList.add('active');
    
    // Update tab buttons
    document.querySelectorAll('#admin .tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(tabName) || 
            (tabName === 'foods' && btn.textContent.includes('Foods')) ||
            (tabName === 'orders' && btn.textContent.includes('Orders')) ||
            (tabName === 'users' && btn.textContent.includes('Users'))) {
            btn.classList.add('active');
        }
    });
    
    // Load data based on tab
    switch(tabName) {
        case 'users':
            loadUsers();
            break;
        case 'foods':
            loadFoods();
            break;
        case 'orders':
            loadOrderHistory();
            break;
    }
}

function loadAdminData() {
    loadFoods();
    loadOrderHistory();
    loadUsers();
}

// Profile Dropdown Functions
function setupProfileDropdown() {
    const profileTrigger = document.querySelector('.profile-trigger');
    const profileDropdown = document.querySelector('.profile-dropdown');
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');
    const logoutItem = document.querySelector('.logout-item');
    
    if (profileTrigger) {
        profileTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Profile trigger clicked'); // Debug log
            toggleProfileDropdown();
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!profileDropdown || !profileDropdown.contains(e.target)) {
            closeProfileDropdown();
        }
    });
    
    // Setup logout functionality
    if (logoutItem) {
        logoutItem.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Logout clicked'); // Debug log
            logout(); // Use the correct logout function
        });
    }
    
    // Prevent dropdown close when clicking inside menu
    if (dropdownMenu) {
        dropdownMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

function toggleProfileDropdown() {
    console.log('Toggle profile dropdown called'); // Debug log
    const profileDropdown = document.querySelector('.profile-dropdown');
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');
    
    console.log('Dropdown elements:', profileDropdown, dropdownMenu); // Debug log
    
    if (profileDropdown && dropdownMenu) {
        const isActive = profileDropdown.classList.contains('active');
        console.log('Current active state:', isActive); // Debug log
        
        if (isActive) {
            closeProfileDropdown();
        } else {
            openProfileDropdown();
        }
    } else {
        console.log('Profile dropdown elements not found'); // Debug log
    }
}

// Make sure the function is globally accessible
window.toggleProfileDropdown = toggleProfileDropdown;

function openProfileDropdown() {
    console.log('Opening profile dropdown'); // Debug log
    const profileDropdown = document.querySelector('.profile-dropdown');
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');
    
    if (profileDropdown && dropdownMenu) {
        profileDropdown.classList.add('active');
        dropdownMenu.classList.add('active');
        console.log('Profile dropdown opened'); // Debug log
    }
}

function closeProfileDropdown() {
    console.log('Closing profile dropdown'); // Debug log
    const profileDropdown = document.querySelector('.profile-dropdown');
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');
    
    if (profileDropdown && dropdownMenu) {
        profileDropdown.classList.remove('active');
        dropdownMenu.classList.remove('active');
        console.log('Profile dropdown closed'); // Debug log
    }
}

function logoutUser() {
    const userName = currentUser ? currentUser.username : 'User';
    
    // Save current cart as guest cart before logout
    if (cart.length > 0) {
        localStorage.setItem('cart_guest', JSON.stringify(cart));
    }
    
    clearAuthData();
    updateAuthUI();
    showSection('home', true);
    updateActiveNavLink('home');
    
    // Show enhanced notification
    showEnhancedNotification(`Goodbye ${userName}! You've been logged out successfully. Your cart has been preserved.`, 'success');
    
    // Keep cart for guest browsing - don't clear it
    updateCartDisplay();
    
    // Redirect to login page after a short delay
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 2000);
}

function setupCartRipple() {
    const cartIcon = document.querySelector('.cart-icon');
    
    if (cartIcon) {
        cartIcon.addEventListener('click', function(e) {
            // Create ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('cart-ripple');
            
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 600);
        });
    }
}

function showEnhancedNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `enhanced-notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #2c3e50;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-width: 300px;
        max-width: 500px;
        transform: translateX(100%);
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    `;
    
    const content = notification.querySelector('.notification-content');
    content.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;
    `;
    
    const icon = notification.querySelector('i');
    icon.style.cssText = `
        color: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        font-size: 1.2rem;
    `;
    
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #7f8c8d;
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        transition: all 0.2s ease;
    `;
    
    closeBtn.addEventListener('mouseenter', function() {
        this.style.background = '#ecf0f1';
        this.style.color = '#2c3e50';
    });
    
    closeBtn.addEventListener('mouseleave', function() {
        this.style.background = 'none';
        this.style.color = '#7f8c8d';
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const foodModal = document.getElementById('foodModal');
    const userModal = document.getElementById('userModal');
    
    if (event.target === foodModal) {
        closeFoodModal();
    }
    if (event.target === userModal) {
        closeUserModal();
    }
});

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Setup character counter for description field
    setupDescriptionCounter();
});
