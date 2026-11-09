// ==========================================
// MILKMAN DAIRY - AUTHENTICATION & SESSION MODULE (auth.js)
// STRICT SAFETY: Do NOT modify without explicit instruction.
// ==========================================

(function() {
    'use strict';

    const getApiBase = () => {
        if (window.API_BASE) return window.API_BASE;
        if (window.location.protocol === 'file:') return 'http://localhost:8080';
        if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8080') {
            return `http://${window.location.hostname}:8080`;
        }
        return window.location.origin;
    };

    const DUMMY_PASSWORD = "MilkmanSecurePassword123!";

    // Check Local Session and update UI state
    const checkSession = async () => {
        const API_BASE = getApiBase();
        const user = localStorage.getItem('milkmanUser');
        const authBtn = document.getElementById('authBtn');
        const userProfile = document.getElementById('userProfile');
        const userNameDisplay = document.getElementById('userNameDisplay');
        const navSub = document.getElementById('navSubscription');
        const mNavSub = document.getElementById('mobileNavSubscription');
        const mNavCart = document.getElementById('mobileNavCart');
        const mNavOrders = document.getElementById('mobileNavOrders');
        const drawerAccount = document.getElementById('drawerAccountSection');

        if (window.updateCartCount) window.updateCartCount();

        if (user) {
            let userData;
            try { userData = JSON.parse(user); } catch (e) { userData = {}; }
            const firstName = (userData.name || 'User').split(' ')[0];
            const cleanPhone = (userData.phone || '').replace(/\D/g, '').replace(/^91/, '');

            if (authBtn) authBtn.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';
            if (userNameDisplay) userNameDisplay.innerText = `Hi, ${firstName}`;
            if (document.getElementById('navCart')) document.getElementById('navCart').style.display = 'inline-block';
            if (document.getElementById('navOrders')) document.getElementById('navOrders').style.display = 'inline-block';
            if (mNavCart) mNavCart.style.display = 'flex';
            if (mNavOrders) mNavOrders.style.display = 'flex';

            if (drawerAccount) {
                drawerAccount.innerHTML = `
                    <div class="drawer-user-info">
                        <div class="drawer-avatar">${(firstName[0] || 'U').toUpperCase()}</div>
                        <div class="drawer-user-meta">
                            <div class="drawer-user-name">Hi, ${firstName}</div>
                            <div class="drawer-user-phone">${cleanPhone ? '+91 ' + cleanPhone : 'Milkman Member'}</div>
                        </div>
                    </div>
                    <button class="drawer-logout-btn" onclick="window.handleLogout ? window.handleLogout() : null">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        Logout
                    </button>
                `;
            }

            // Check if user has active subscription to conditionally show "My Subscription" button
            const setSubDisplay = (show) => {
                const val = show ? 'inline-block' : 'none';
                const mVal = show ? 'flex' : 'none';
                if (navSub) navSub.style.display = val;
                if (mNavSub) mNavSub.style.display = mVal;
            };

            if (userData.isSubscribed) {
                setSubDisplay(true);
            } else {
                try {
                    const checkRes = await fetch(`${API_BASE}/api/subscription/my-status?phone=${encodeURIComponent(userData.phone || '')}&userId=${encodeURIComponent(userData.id || '')}`);
                    const checkData = await checkRes.json();
                    if (checkData.success && checkData.hasSubscription) {
                        userData.isSubscribed = true;
                        localStorage.setItem('milkmanUser', JSON.stringify(userData));
                        setSubDisplay(true);
                    } else {
                        setSubDisplay(false);
                    }
                } catch (e) {
                    setSubDisplay(false);
                }
            }
        } else {
            if (authBtn) authBtn.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';
            if (document.getElementById('navCart')) document.getElementById('navCart').style.display = 'none';
            if (document.getElementById('navOrders')) document.getElementById('navOrders').style.display = 'none';
            if (navSub) navSub.style.display = 'none';
            if (mNavSub) mNavSub.style.display = 'none';
            if (mNavCart) mNavCart.style.display = 'none';
            if (mNavOrders) mNavOrders.style.display = 'none';

            if (drawerAccount) {
                drawerAccount.innerHTML = `
                    <div class="drawer-user-info">
                        <div class="drawer-avatar">👤</div>
                        <div class="drawer-user-meta">
                            <div class="drawer-user-name">Welcome, Guest</div>
                            <div class="drawer-user-phone">Sign in for orders & plans</div>
                        </div>
                    </div>
                    <button class="drawer-login-btn" onclick="if(window.openLoginModal)window.openLoginModal();">
                        Login / Sign Up
                    </button>
                `;
            }
        }
    };

    // Logout Handler
    const handleLogout = async () => {
        const API_BASE = getApiBase();
        const user = localStorage.getItem('milkmanUser');
        if (user) {
            try {
                const userData = JSON.parse(user);
                const email = `${(userData.phone || '').replace(/\D/g, '')}@milkman.local`;
                await fetch(API_BASE + '/api/custom/update-status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, status: 'offline' })
                });
            } catch (e) { }
        }

        localStorage.removeItem('milkmanUser');
        try {
            await fetch(API_BASE + '/api/auth/sign-out', { method: 'POST' });
        } catch (e) { }
        if (window.closeMobileNav) window.closeMobileNav();
        checkSession();
    };

    // Show/Hide Auth Modal
    function showAuthStep(step = 1) {
        if (window.closeMobileNav) {
            window.closeMobileNav();
        }

        const authModal = document.getElementById('authModal');
        const step1 = document.getElementById('step-1');
        const step2 = document.getElementById('step-2');
        const authName = document.getElementById('authName');
        const authPhone = document.getElementById('authPhone');
        const authOtp = document.getElementById('authOtp');

        if (authModal) {
            authModal.classList.add('active');
            authModal.style.display = 'flex';
        }

        if (step === 1) {
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';
            setTimeout(() => {
                if (authPhone && !authPhone.value) authPhone.focus();
                else if (authName) authName.focus();
            }, 80);
        } else if (step === 2) {
            if (step1) step1.style.display = 'none';
            if (step2) step2.style.display = 'block';
            setTimeout(() => {
                if (authOtp) authOtp.focus();
            }, 80);
        }
    }

    function closeAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('active');
            authModal.style.display = 'none';
        }
        if (window.location.hash === '#login' || window.location.hash === '#verify-otp') {
            window.location.hash = '';
        }
    }

    function openLoginModal() {
        window.location.hash = 'login';
        showAuthStep(1);
    }

    // Initialize Auth Listeners when DOM is ready
    function initAuth() {
        const authBtn = document.getElementById('authBtn');
        const authModal = document.getElementById('authModal');
        const closeModal = document.getElementById('closeModal');
        const sendOtpBtn = document.getElementById('sendOtpBtn');
        const verifyOtpBtn = document.getElementById('verifyOtpBtn');
        const backBtn = document.getElementById('backBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const authName = document.getElementById('authName');
        const authPhone = document.getElementById('authPhone');
        const authOtp = document.getElementById('authOtp');

        // Open Modal click handler
        if (authBtn) {
            authBtn.onclick = (e) => {
                e.preventDefault();
                openLoginModal();
            };
        }

        // Close Modal on 'X' button
        if (closeModal) {
            closeModal.onclick = (e) => {
                e.preventDefault();
                closeAuthModal();
            };
        }

        // Close Modal on clicking backdrop
        if (authModal) {
            authModal.onclick = (e) => {
                if (e.target === authModal) {
                    closeAuthModal();
                }
            };
        }

        // Logout Button
        if (logoutBtn) {
            logoutBtn.onclick = (e) => {
                e.preventDefault();
                handleLogout();
            };
        }

        // Step 1: Request OTP or Smart Passwordless Login
        if (sendOtpBtn) {
            sendOtpBtn.onclick = async (e) => {
                e.preventDefault();
                const API_BASE = getApiBase();
                let phone = authPhone ? authPhone.value.trim().replace(/\D/g, '') : '';
                const name = authName ? authName.value.trim() : '';

                if (!phone || (phone.length !== 10 && phone.length !== 12)) {
                    if (window.customAlert) {
                        return await window.customAlert("Invalid Phone", "Please enter a valid 10-digit mobile number");
                    }
                    return alert("Please enter a valid 10-digit mobile number");
                }

                if (phone.length === 10) phone = '91' + phone;

                sendOtpBtn.innerText = "Checking account...";
                sendOtpBtn.disabled = true;

                try {
                    // 1. Check if user is already registered in DB
                    const checkRes = await fetch(API_BASE + '/api/custom/check-user-auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phoneNumber: phone })
                    });

                    const checkData = await checkRes.json();

                    if (checkData.isListed && checkData.user) {
                        // Smart zero-friction instant login!
                        const loggedUser = {
                            id: checkData.user.id,
                            name: checkData.user.name || name || 'Customer',
                            phone: checkData.user.phone || phone,
                            email: checkData.user.email,
                            deliveryArea: checkData.user.deliveryArea,
                            houseNo: checkData.user.houseNo,
                            deviceToken: checkData.user.deviceToken,
                            isSubscribed: !!checkData.user.isSubscribed
                        };

                        localStorage.setItem('milkmanUser', JSON.stringify(loggedUser));
                        if (checkData.user.deviceToken) {
                            localStorage.setItem('milkmanDeviceToken', checkData.user.deviceToken);
                        }

                        // Update online status in background
                        try {
                            await fetch(API_BASE + '/api/custom/update-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: loggedUser.email, status: 'active', phone: loggedUser.phone })
                            });
                        } catch (e) { }

                        closeAuthModal();

                        if (window.customAlert) {
                            await window.customAlert("Welcome Back!", `Welcome back, ${loggedUser.name}! You are logged in.`);
                        }

                        checkSession();

                        if (typeof window.loadMySubscription === 'function') {
                            window.loadMySubscription();
                        }
                        return;
                    }

                    // 2. User is not yet registered, verify via WhatsApp OTP
                    if (!name) {
                        sendOtpBtn.innerText = "Get OTP via WhatsApp";
                        sendOtpBtn.disabled = false;
                        if (window.customAlert) {
                            return await window.customAlert("Name Required", "Please enter your full name to create an account.");
                        }
                        return alert("Please enter your name");
                    }

                    sendOtpBtn.innerText = "Sending OTP...";
                    const response = await fetch(API_BASE + '/api/custom/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phoneNumber: phone })
                    });

                    const data = await response.json();
                    if (response.ok) {
                        window.location.hash = 'verify-otp';
                        showAuthStep(2);
                    } else {
                        if (window.customAlert) await window.customAlert("OTP Failed", data.error || "Failed to send OTP");
                        else alert(data.error || "Failed to send OTP");
                    }
                } catch (error) {
                    console.error("Auth error:", error);
                    if (window.customAlert) await window.customAlert("Connection Error", "Backend server is unreachable. Please make sure the server is running.");
                    else alert("Server is not running.");
                } finally {
                    sendOtpBtn.innerText = "Get OTP via WhatsApp";
                    sendOtpBtn.disabled = false;
                }
            };
        }

        // Back Button in Step 2
        if (backBtn) {
            backBtn.onclick = (e) => {
                e.preventDefault();
                window.location.hash = 'login';
                showAuthStep(1);
            };
        }

        // Enter key listeners
        if (authPhone) {
            authPhone.onkeyup = (e) => {
                if (e.key === 'Enter' && sendOtpBtn) sendOtpBtn.click();
            };
        }
        if (authOtp) {
            authOtp.onkeyup = (e) => {
                if (e.key === 'Enter' && verifyOtpBtn) verifyOtpBtn.click();
            };
        }

        // Step 2: Verify OTP and Login
        if (verifyOtpBtn) {
            verifyOtpBtn.onclick = async (e) => {
                e.preventDefault();
                const API_BASE = getApiBase();
                let phone = authPhone ? authPhone.value.trim().replace(/\D/g, '') : '';
                if (phone.length === 10) phone = '91' + phone;

                const name = authName ? authName.value.trim() : '';
                const otp = authOtp ? authOtp.value.trim() : '';

                if (!otp) {
                    return window.customAlert ? await window.customAlert("OTP Required", "Please enter the OTP") : alert("Please enter the OTP");
                }

                verifyOtpBtn.innerText = "Verifying...";
                verifyOtpBtn.disabled = true;

                try {
                    // 1. Verify OTP with custom endpoint
                    const verifyRes = await fetch(API_BASE + '/api/custom/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ phoneNumber: phone, otp })
                    });

                    if (!verifyRes.ok) {
                        throw new Error("Invalid OTP");
                    }

                    const email = `${phone.replace(/\D/g, '')}@milkman.local`;

                    // 2. Try to Sign In (if user exists)
                    let authRes = await fetch(API_BASE + '/api/auth/sign-in/email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, password: DUMMY_PASSWORD })
                    });

                    // 3. If Sign In fails, Sign Up!
                    if (!authRes.ok) {
                        authRes = await fetch(API_BASE + '/api/auth/sign-up/email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email, password: DUMMY_PASSWORD, name })
                        });
                    }

                    const authData = await authRes.json();

                    if (authRes.ok) {
                        const userId = authData.user ? authData.user.id : '';
                        localStorage.setItem('milkmanUser', JSON.stringify({
                            id: userId,
                            name: authData.user.name,
                            phone,
                            email,
                            isSubscribed: false
                        }));
                        closeAuthModal();
                        checkSession();

                        // Mark as active
                        try {
                            await fetch(API_BASE + '/api/custom/update-status', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email, status: 'active', phone })
                            });
                        } catch (e) { }

                        // Init FCM
                        if (window.initFirebaseFCM) window.initFirebaseFCM(phone);

                        if (window.customAlert) {
                            await window.customAlert("Success", "Successfully logged in! 🎉");
                        } else {
                            alert("Successfully logged in! 🎉");
                        }
                    } else {
                        throw new Error(authData.message || "Auth failed");
                    }

                } catch (error) {
                    if (window.customAlert) await window.customAlert("Authentication Failed", error.message);
                    else alert(error.message);
                } finally {
                    verifyOtpBtn.innerText = "Verify & Proceed";
                    verifyOtpBtn.disabled = false;
                }
            };
        }

        // Initial session check
        checkSession();

        // Check if page loaded directly on #login or #verify-otp
        if (window.location.hash === '#login') {
            showAuthStep(1);
        } else if (window.location.hash === '#verify-otp') {
            showAuthStep(2);
        }
    }

    // Expose global methods
    window.checkSession = checkSession;
    window.handleLogout = handleLogout;
    window.showAuthStep = showAuthStep;
    window.closeAuthModal = closeAuthModal;
    window.openLoginModal = openLoginModal;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAuth);
    } else {
        initAuth();
    }
})();
