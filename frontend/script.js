// DOM Elements
const loginTab = document.getElementById('loginTab');
const signupTab = document.getElementById('signupTab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const switchToSignup = document.getElementById('switchToSignup');
const switchToLogin = document.getElementById('switchToLogin');
const toastContainer = document.getElementById('toastContainer');

// API Base URL
const API_BASE_URL = 'http://localhost:5000';

// 🔥 IMPORTANT: Clear any existing user data when login page loads
// This ensures fresh login page every time
localStorage.removeItem('user');
localStorage.removeItem('username');
sessionStorage.removeItem('user');
sessionStorage.removeItem('username');

// Toggle password visibility
window.togglePassword = function(inputId, icon) {
    const input = document.getElementById(inputId);
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
};

// Show toast message
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s reverse';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// Password strength checker
function checkPasswordStrength(password) {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]+/)) strength += 25;
    if (password.match(/[A-Z]+/)) strength += 25;
    if (password.match(/[0-9]+/)) strength += 25;
    if (password.match(/[$@#&!]+/)) strength += 25;
    
    strength = Math.min(strength, 100);
    
    const strengthBar = document.getElementById('strengthBar');
    if (strengthBar) {
        strengthBar.style.width = strength + '%';
        
        if (strength < 25) {
            strengthBar.style.background = '#f44336';
        } else if (strength < 50) {
            strengthBar.style.background = '#ff9800';
        } else if (strength < 75) {
            strengthBar.style.background = '#ffc107';
        } else {
            strengthBar.style.background = '#4caf50';
        }
    }
    
    return strength;
}

// Password input listener
document.getElementById('signupPassword')?.addEventListener('input', (e) => {
    checkPasswordStrength(e.target.value);
});

// Tab switching
if (loginTab && signupTab) {
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    });

    signupTab.addEventListener('click', () => {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    });
}

// Switch between forms using links
switchToSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    signupTab.click();
});

switchToLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    loginTab.click();
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    if (!username || !password) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.getElementById('loginBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span>Logging in...</span> <i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            
            // Clear any existing data first
            localStorage.removeItem('user');
            localStorage.removeItem('username');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('username');
            
            // Store user data if remember me is checked
            if (rememberMe) {
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('username', data.user.username);
            } else {
                sessionStorage.setItem('user', JSON.stringify(data.user));
                sessionStorage.setItem('username', data.user.username);
            }
            
            // Reset form
            loginForm.reset();
            
            // Redirect to main.html after successful login
            setTimeout(() => {
                window.location.href = '/main.html';
            }, 2000);
        } else {
            showToast(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error. Please check if server is running.', 'error');
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
});

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('signupUsername').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const terms = document.getElementById('terms').checked;
    
    // Validation
    if (!username || !email || !password || !confirm) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    if (username.length < 3) {
        showToast('Username must be at least 3 characters', 'error');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (!terms) {
        showToast('You must agree to the Terms of Service', 'error');
        return;
    }
    
    // Show loading state
    const btn = document.getElementById('signupBtn');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<span>Creating account...</span> <i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (response.status === 201 || data.success) {
            showToast(data.message || 'Account created successfully!', 'success');
            
            // Reset form
            signupForm.reset();
            
            // Switch to login after 2 seconds
            setTimeout(() => {
                loginTab.click();
            }, 2000);
        } else {
            showToast(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Network error. Please check if server is running.', 'error');
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
    }
});

// 🔥 REMOVED: Auto-redirect if user is logged in
// We don't want this anymore because we want login page to always show first

// Forgot password link
document.querySelector('.forgot-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('Password reset feature coming soon!', 'info');
});