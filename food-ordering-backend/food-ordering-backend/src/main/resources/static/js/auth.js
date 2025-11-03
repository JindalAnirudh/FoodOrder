// API Base URL
const API_BASE_URL = window.location.origin;

// Password visibility toggle
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(fieldId + '-eye');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

// Notification functions
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.classList.remove('success', 'error');
    notification.classList.add(isError ? 'error' : 'success', 'active');
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    document.getElementById('notification').classList.remove('active');
}

// Loading functions
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId);
    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');
    
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        btnText.style.display = 'block';
        btnLoader.style.display = 'none';
    }
}

// Form validation
function validatePassword(password, confirmPassword = null) {
    if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
    }
    
    if (confirmPassword !== null && password !== confirmPassword) {
        throw new Error('Passwords do not match');
    }
    
    return true;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
    }
    return true;
}

function validateUsername(username) {
    if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username can only contain letters, numbers, and underscores');
    }
    
    return true;
}

// Login function
async function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    // Basic validation
    if (!username || !password) {
        showNotification('Please fill in all fields', true);
        return;
    }
    
    setButtonLoading('loginBtn', true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            let errorMessage = 'Login failed';
            
            if (response.status === 401) {
                errorMessage = 'Invalid username or password';
            } else if (response.status === 404) {
                errorMessage = 'User not found';
            } else if (errorData) {
                try {
                    const errorJson = JSON.parse(errorData);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) {
                    // If not JSON, use as plain text
                    errorMessage = errorData;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        
        // Create comprehensive user object
        const currentUser = {
            username: username,
            role: data.role,
            loginTime: new Date().toISOString(),
            isAuthenticated: true
        };
        
        // Store authentication data securely
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        localStorage.setItem('userSession', JSON.stringify({
            username: username,
            role: data.role,
            loginTime: currentUser.loginTime,
            expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString() // 10 hours
        }));
        
        // Show personalized welcome message
        showNotification(`Welcome back, ${username}! ${data.role === 'ADMIN' ? 'Admin access granted.' : 'Ready to order some delicious food!'}`, false);
        
        // Redirect with proper handling
        setTimeout(() => {
            redirectToMainApp();
        }, 2000);
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(error.message, true);
    } finally {
        setButtonLoading('loginBtn', false);
    }
}

// Register function
async function register(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    
    // Basic validation (role is now hidden and automatically set)
    if (!username || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', true);
        return;
    }
    
    try {
        // Validate inputs
        validateUsername(username);
        validateEmail(email);
        validatePassword(password, confirmPassword);
        
    } catch (error) {
        showNotification(error.message, true);
        return;
    }
    
    setButtonLoading('registerBtn', true);
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password, role })
        });
        
        if (!response.ok) {
            const errorData = await response.text();
            let errorMessage = 'Registration failed';
            
            if (response.status === 400) {
                errorMessage = 'Username or email already exists';
            } else if (errorData) {
                try {
                    const errorJson = JSON.parse(errorData);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) {
                    // If not JSON, use as plain text
                    errorMessage = errorData;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        // Show success message
        showNotification(`Account created successfully! Please login to continue.`);
        
        // Store registration success for login page
        sessionStorage.setItem('registrationSuccess', JSON.stringify({
            username: username,
            role: role,
            timestamp: new Date().toISOString()
        }));
        
        // Auto-login after registration (optional but better UX)
        setTimeout(async () => {
            try {
                const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });
                
                if (loginResponse.ok) {
                    const loginData = await loginResponse.json();
                    
                    // Store authentication data
                    const currentUser = {
                        username: username,
                        role: loginData.role,
                        loginTime: new Date().toISOString(),
                        isAuthenticated: true,
                        isNewUser: true
                    };
                    
                    localStorage.setItem('authToken', loginData.token);
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    localStorage.setItem('userSession', JSON.stringify({
                        username: username,
                        role: loginData.role,
                        loginTime: currentUser.loginTime,
                        expiresAt: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString()
                    }));
                    
                    showNotification(`Welcome to FoodOrder, ${username}! Account created and logged in successfully.`);
                    
                    setTimeout(() => {
                        redirectToMainApp();
                    }, 2000);
                } else {
                    // Fallback to login page
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1000);
                }
            } catch (autoLoginError) {
                console.error('Auto-login failed:', autoLoginError);
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            }
        }, 1500);
        
    } catch (error) {
        console.error('Registration error:', error);
        showNotification(error.message, true);
    } finally {
        setButtonLoading('registerBtn', false);
    }
}

// Redirect to main application
function redirectToMainApp() {
    // Clear any existing registration success data
    sessionStorage.removeItem('registrationSuccess');
    
    // Add a flag to indicate successful authentication
    sessionStorage.setItem('authenticationSuccess', 'true');
    
    // Redirect to main application
    window.location.replace('index.html'); // Use replace to prevent back navigation
}

// Validate user session
function validateUserSession() {
    const authToken = localStorage.getItem('authToken');
    const userSession = localStorage.getItem('userSession');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!authToken || !userSession || !currentUser) {
        return false;
    }
    
    try {
        const session = JSON.parse(userSession);
        const user = JSON.parse(currentUser);
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        
        // Check if session has expired
        if (now > expiresAt) {
            clearUserSession();
            return false;
        }
        
        // Validate user data consistency
        if (session.username !== user.username || session.role !== user.role) {
            clearUserSession();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Session validation error:', error);
        clearUserSession();
        return false;
    }
}

// Clear user session
function clearUserSession() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userSession');
    sessionStorage.removeItem('authenticationSuccess');
}

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Validate existing session
    if (validateUserSession()) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        showNotification(`You're already logged in as ${currentUser.username}. Redirecting...`);
        
        setTimeout(() => {
            redirectToMainApp();
        }, 1500);
        return;
    }
    
    // Check for registration success message
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    if (registrationSuccess) {
        try {
            const regData = JSON.parse(registrationSuccess);
            showNotification(`Welcome ${regData.username}! Please login to your new account.`);
            
            // Pre-fill username if on login page
            const usernameField = document.getElementById('username');
            if (usernameField) {
                usernameField.value = regData.username;
            }
            
            sessionStorage.removeItem('registrationSuccess');
        } catch (error) {
            console.error('Error processing registration success:', error);
        }
    }
    
    // Add real-time validation for password confirmation
    const confirmPasswordField = document.getElementById('confirmPassword');
    const passwordField = document.getElementById('password');
    
    if (confirmPasswordField && passwordField) {
        confirmPasswordField.addEventListener('input', function() {
            if (this.value && passwordField.value) {
                if (this.value !== passwordField.value) {
                    this.setCustomValidity('Passwords do not match');
                    this.style.borderColor = '#ee5a24';
                } else {
                    this.setCustomValidity('');
                    this.style.borderColor = '#10ac84';
                }
            } else {
                this.setCustomValidity('');
                this.style.borderColor = '';
            }
        });
        
        passwordField.addEventListener('input', function() {
            if (confirmPasswordField.value && this.value) {
                if (confirmPasswordField.value !== this.value) {
                    confirmPasswordField.setCustomValidity('Passwords do not match');
                    confirmPasswordField.style.borderColor = '#ee5a24';
                } else {
                    confirmPasswordField.setCustomValidity('');
                    confirmPasswordField.style.borderColor = '#10ac84';
                }
            }
        });
    }
    
    // Add focus animations
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
    });
});
