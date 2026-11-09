// ==========================================
// MILKMAN DAIRY - CORE APPLICATION ORCHESTRATOR (main.js)
// Core setup, Hash Routing, Mobile Drawer, Custom Plan & Notifications
// ==========================================

(function() {
    'use strict';

    // 1. API Configuration
    const getApiBase = () => {
        if (window.location.protocol === 'file:') return 'http://localhost:8080';
        if ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && window.location.port !== '8080') {
            return `http://${window.location.hostname}:8080`;
        }
        return window.location.origin;
    };
    const API_BASE = getApiBase();
    window.API_BASE = API_BASE;

    // 2. Custom Popup Logic Override
    window.customAlert = (title, message) => {
        return new Promise((resolve) => {
            const overlay = document.getElementById('customPopupOverlay');
            if (!overlay) return resolve(true);
            const titleEl = document.getElementById('customPopupTitle');
            const msgEl = document.getElementById('customPopupMessage');
            const inputEl = document.getElementById('customPopupInput');
            const buttonsEl = document.getElementById('customPopupButtons');

            if (titleEl) titleEl.innerText = title || 'Alert';
            if (msgEl) msgEl.innerText = message || '';
            if (inputEl) inputEl.style.display = 'none';

            if (buttonsEl) {
                buttonsEl.innerHTML = `<button class="custom-popup-btn btn-confirm">OK</button>`;
                overlay.classList.add('active');
                const confirmBtn = buttonsEl.querySelector('.btn-confirm');
                if (confirmBtn) {
                    confirmBtn.onclick = () => {
                        overlay.classList.remove('active');
                        resolve(true);
                    };
                }
            } else {
                resolve(true);
            }
        });
    };

    // Override default alert
    window.alert = (msg) => {
        window.customAlert("Message", msg);
    };

    // 3. Hash Routing Logic
    const handleHashChange = () => {
        const hash = window.location.hash || '#home';

        // Check if Auth modal should show
        if (hash === '#login') {
            if (window.showAuthStep) window.showAuthStep(1);
        } else if (hash === '#verify-otp') {
            if (window.showAuthStep) window.showAuthStep(2);
        } else {
            const authModal = document.getElementById('authModal');
            if (authModal && !authModal.classList.contains('active-manual')) {
                authModal.classList.remove('active');
                authModal.style.display = 'none';
            }
        }

        // Retrieve sections
        const homeSection = document.getElementById('home');
        const plansSection = document.getElementById('plans');
        const productsSection = document.getElementById('products');
        const promoRibbon = document.querySelector('.promo-ribbon');
        const cartSection = document.getElementById('cartSection');
        const ordersSection = document.getElementById('ordersSection');

        if (hash === '#cart') {
            if (homeSection) homeSection.style.display = 'none';
            if (plansSection) plansSection.style.display = 'none';
            if (productsSection) productsSection.style.display = 'none';
            if (promoRibbon) promoRibbon.style.display = 'none';
            if (ordersSection) ordersSection.style.display = 'none';

            if (cartSection) cartSection.style.display = 'block';
            if (window.renderCart) window.renderCart();
            window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (hash === '#orders') {
            window.location.href = 'orders.html';
            return;
        } else {
            if (cartSection) cartSection.style.display = 'none';
            if (ordersSection) ordersSection.style.display = 'none';

            if (homeSection) homeSection.style.display = 'flex';
            if (plansSection) plansSection.style.display = 'block';
            if (productsSection) productsSection.style.display = 'block';
            if (promoRibbon) promoRibbon.style.display = 'block';

            if (hash === '#products' && productsSection) {
                setTimeout(() => {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            } else if (hash === '#plans' && plansSection) {
                setTimeout(() => {
                    plansSection.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            } else if (hash === '#home' || hash === '') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    window.handleHashChange = handleHashChange;
    window.addEventListener('hashchange', handleHashChange);

    // 4. Mobile Hamburger Navigation Drawer Handlers
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeMobileNavBtn = document.getElementById('closeMobileNavBtn');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');
    const mobileNavBackdrop = document.getElementById('mobileNavBackdrop');

    const openMobileNav = () => {
        if (mobileNavDrawer && mobileNavBackdrop) {
            mobileNavDrawer.classList.add('active');
            mobileNavBackdrop.classList.add('active');
            document.body.classList.add('drawer-open');
            document.body.style.overflow = 'hidden';
        }
    };

    const closeMobileNav = () => {
        if (mobileNavDrawer && mobileNavBackdrop) {
            mobileNavDrawer.classList.remove('active');
            mobileNavBackdrop.classList.remove('active');
            document.body.classList.remove('drawer-open');
            document.body.style.overflow = '';
        }
    };

    window.closeMobileNav = closeMobileNav;
    window.openMobileNav = openMobileNav;

    // 5. Firebase Web Push (FCM) Logic
    const initFirebaseFCM = async (phone) => {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyBlNQtRU_EmLGeUzcspfGNi4Hr1H3sdDqU",
                authDomain: "barber-app-6993a.firebaseapp.com",
                projectId: "barber-app-6993a",
                storageBucket: "barber-app-6993a.firebasestorage.app",
                messagingSenderId: "1091592092089",
                appId: "1:1091592092089:android:03dad6d101f55c9beade68"
            };

            if (firebaseConfig.apiKey === "YOUR_API_KEY" || !window.initializeApp) {
                return;
            }

            const app = window.initializeApp(firebaseConfig);
            const messaging = window.getMessaging(app);

            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const currentToken = await window.getToken(messaging, {
                    vapidKey: 'BH9gOHm_tq4c8-cKcbS3gsaqEmR-aCExhB5Sr9ANLXFSBD_55Bh0JRIQFHJDihUHVI_KgqgtoRk-QMOk0F77aqw'
                });
                if (currentToken) {
                    await fetch(API_BASE + '/api/custom/update-player-id', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            email: `${phone.replace(/\D/g, '')}@milkman.local`,
                            playerId: currentToken
                        })
                    });
                }
            }
        } catch (error) {
            console.error('FCM retrieval error:', error);
        }
    };
    window.initFirebaseFCM = initFirebaseFCM;

    // 6. Custom Plan Bottom Sheet Interactive Logic
    function initCustomPlanSheet() {
        const ribbonCard = document.getElementById('ribbonCustomPlanCard');
        const openBtn = document.getElementById('btnOpenCustomPlanSheet');
        const modal = document.getElementById('customPlanSheetModal');
        const backdrop = document.getElementById('customSheetBackdrop');
        const closeBtn = document.getElementById('closeCustomPlanSheetBtn');
        const addCartBtn = document.getElementById('btnAddToCartCustomPlan');

        if (!modal) return;

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);

        const formatDateStr = (d) => d.toISOString().split('T')[0];
        const formatNiceDate = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

        const tomorrowStr = formatDateStr(tomorrow);
        const dayAfterStr = formatDateStr(dayAfter);

        const tomorrowLabel = document.getElementById('tomorrowDateLabel');
        const dayAfterLabel = document.getElementById('dayAfterDateLabel');
        const dateInput = document.getElementById('customDatePickerInput');

        if (tomorrowLabel) tomorrowLabel.innerText = formatNiceDate(tomorrow);
        if (dayAfterLabel) dayAfterLabel.innerText = formatNiceDate(dayAfter);
        if (dateInput) {
            dateInput.min = tomorrowStr;
            dateInput.value = tomorrowStr;
        }

        const state = {
            milkType: 'cow',
            milkName: 'Pure Desi Cow Milk',
            ratePerLiter: 56,
            quantity: 1.0,
            startDate: tomorrowStr,
            durationDays: 30
        };

        const choiceCow = document.getElementById('choiceCow');
        const choiceBuffalo = document.getElementById('choiceBuffalo');
        const qtyRateDisplay = document.getElementById('qtyLiveRateDisplay');
        const stepperValText = document.getElementById('stepperValText');
        const stepperMinusBtn = document.getElementById('stepperMinusBtn');
        const stepperPlusBtn = document.getElementById('stepperPlusBtn');
        const chipTomorrow = document.getElementById('chipStartTomorrow');
        const chipDayAfter = document.getElementById('chipStartDayAfter');
        const headlineEl = document.getElementById('sheetSummaryHeadline');
        const subHeadlineEl = document.getElementById('sheetSummarySub');
        const dailyCostEl = document.getElementById('sheetDailyCost');
        const durationValEl = document.getElementById('sheetDurationVal');
        const totalAmountEl = document.getElementById('sheetTotalAmount');

        function updateSummary() {
            const dailyCost = Math.round(state.quantity * state.ratePerLiter);
            const totalAmount = dailyCost * state.durationDays;

            if (qtyRateDisplay) qtyRateDisplay.innerText = `₹${dailyCost} / day`;
            if (stepperValText) stepperValText.innerText = state.quantity.toFixed(1);
            if (dailyCostEl) dailyCostEl.innerText = `₹${dailyCost} / day`;
            if (durationValEl) durationValEl.innerText = `${state.durationDays} Days`;
            if (totalAmountEl) totalAmountEl.innerText = totalAmount.toLocaleString('en-IN');

            const startObj = new Date(state.startDate);
            const niceStart = isNaN(startObj.getTime()) ? state.startDate : formatNiceDate(startObj);

            if (headlineEl) headlineEl.innerText = `${state.milkName} • ${state.quantity}L Daily`;
            if (subHeadlineEl) subHeadlineEl.innerText = `Starts ${niceStart} • ${state.durationDays} Days Deliveries`;
        }

        function openSheet() {
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            updateSummary();
        }

        function closeSheet() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        if (ribbonCard) ribbonCard.addEventListener('click', openSheet);
        if (openBtn) openBtn.addEventListener('click', (e) => { e.stopPropagation(); openSheet(); });
        if (backdrop) backdrop.addEventListener('click', closeSheet);
        if (closeBtn) closeBtn.addEventListener('click', closeSheet);

        if (choiceCow) {
            choiceCow.addEventListener('click', () => {
                choiceCow.classList.add('active');
                if (choiceBuffalo) choiceBuffalo.classList.remove('active');
                state.milkType = 'cow';
                state.milkName = 'Pure Desi Cow Milk';
                state.ratePerLiter = 56;
                updateSummary();
            });
        }
        if (choiceBuffalo) {
            choiceBuffalo.addEventListener('click', () => {
                choiceBuffalo.classList.add('active');
                if (choiceCow) choiceCow.classList.remove('active');
                state.milkType = 'buffalo';
                state.milkName = 'Pure Buffalo Milk';
                state.ratePerLiter = 66;
                updateSummary();
            });
        }

        const qtyPills = document.querySelectorAll('.qty-quick-pill');
        qtyPills.forEach(pill => {
            pill.addEventListener('click', () => {
                qtyPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.quantity = parseFloat(pill.getAttribute('data-qty')) || 1.0;
                updateSummary();
            });
        });

        if (stepperMinusBtn) {
            stepperMinusBtn.addEventListener('click', () => {
                if (state.quantity > 0.5) {
                    state.quantity = Math.max(0.5, Math.round((state.quantity - 0.5) * 10) / 10);
                    qtyPills.forEach(p => {
                        if (parseFloat(p.getAttribute('data-qty')) === state.quantity) p.classList.add('active');
                        else p.classList.remove('active');
                    });
                    updateSummary();
                }
            });
        }
        if (stepperPlusBtn) {
            stepperPlusBtn.addEventListener('click', () => {
                if (state.quantity < 10.0) {
                    state.quantity = Math.round((state.quantity + 0.5) * 10) / 10;
                    qtyPills.forEach(p => {
                        if (parseFloat(p.getAttribute('data-qty')) === state.quantity) p.classList.add('active');
                        else p.classList.remove('active');
                    });
                    updateSummary();
                }
            });
        }

        if (chipTomorrow) {
            chipTomorrow.addEventListener('click', () => {
                chipTomorrow.classList.add('active');
                if (chipDayAfter) chipDayAfter.classList.remove('active');
                state.startDate = tomorrowStr;
                if (dateInput) dateInput.value = tomorrowStr;
                updateSummary();
            });
        }
        if (chipDayAfter) {
            chipDayAfter.addEventListener('click', () => {
                chipDayAfter.classList.add('active');
                if (chipTomorrow) chipTomorrow.classList.remove('active');
                state.startDate = dayAfterStr;
                if (dateInput) dateInput.value = dayAfterStr;
                updateSummary();
            });
        }
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                if (dateInput.value) {
                    state.startDate = dateInput.value;
                    if (chipTomorrow) chipTomorrow.classList.toggle('active', dateInput.value === tomorrowStr);
                    if (chipDayAfter) chipDayAfter.classList.toggle('active', dateInput.value === dayAfterStr);
                    updateSummary();
                }
            });
        }

        const durPills = document.querySelectorAll('.dur-pick-pill');
        durPills.forEach(pill => {
            pill.addEventListener('click', () => {
                durPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.durationDays = parseInt(pill.getAttribute('data-days')) || 30;
                updateSummary();
            });
        });

        if (addCartBtn) {
            addCartBtn.addEventListener('click', () => {
                const userSession = localStorage.getItem('milkmanUser');
                if (!userSession) {
                    closeSheet();
                    if (window.customAlert) {
                        window.customAlert("Login Required", "Please login first to build and book your custom plan!");
                    } else {
                        alert("Please login first to build and book your custom plan!");
                    }
                    window.location.hash = 'login';
                    if (window.showAuthStep) window.showAuthStep(1);
                    return;
                }

                const dailyCost = Math.round(state.quantity * state.ratePerLiter);
                const totalAmount = dailyCost * state.durationDays;
                const productId = `plan_custom_${state.milkType}_${state.quantity}L_${state.durationDays}d`;
                const productName = `${state.milkName} Custom Plan (${state.quantity}L/day • ${state.durationDays} Days)`;
                const imageUrl = state.milkType === 'cow' ? 'assets/cow_milk_plan.jpg' : 'assets/buffalo_milk_plan.png';
                const unit = `${state.durationDays} Days (${state.quantity}L/day)`;

                let cart = JSON.parse(localStorage.getItem('milkmanCart') || '[]');

                const existingIdx = cart.findIndex(i => i.productId && i.productId.startsWith('plan_'));
                const newPlanItem = {
                    productId,
                    productName,
                    price: totalAmount,
                    quantity: 1,
                    imageUrl,
                    unit,
                    isCustomPlan: true,
                    customDetails: {
                        milkType: state.milkType,
                        dailyQuantity: `${state.quantity} Liter`,
                        startDate: state.startDate,
                        totalDays: state.durationDays,
                        ratePerUnit: state.ratePerLiter
                    }
                };

                if (existingIdx !== -1) {
                    cart[existingIdx] = newPlanItem;
                } else {
                    cart.push(newPlanItem);
                }

                localStorage.setItem('milkmanCart', JSON.stringify(cart));
                if (window.updateCartCount) window.updateCartCount();

                closeSheet();

                if (window.location.hash === '#cart') {
                    if (window.handleHashChange) window.handleHashChange();
                    if (window.renderCart) window.renderCart();
                } else {
                    window.location.hash = 'cart';
                }
            });
        }
    }

    // App Initialization
    function initApp() {
        // Mobile drawer bindings
        if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileNav);
        if (closeMobileNavBtn) closeMobileNavBtn.addEventListener('click', closeMobileNav);
        if (mobileNavBackdrop) {
            mobileNavBackdrop.addEventListener('click', closeMobileNav);
            mobileNavBackdrop.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
        }

        // Auto-close drawer on link click
        document.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', closeMobileNav);
        });

        // Ensure clicking Nav Cart when already on #cart re-triggers routing
        const navCartLink = document.getElementById('navCart');
        if (navCartLink) {
            navCartLink.addEventListener('click', (e) => {
                if (window.location.hash === '#cart') {
                    e.preventDefault();
                    handleHashChange();
                }
            });
        }

        // Ensure clicking Nav Orders when already on #orders re-triggers routing
        const navOrdersLink = document.getElementById('navOrders');
        if (navOrdersLink) {
            navOrdersLink.addEventListener('click', (e) => {
                if (window.location.hash === '#orders') {
                    e.preventDefault();
                    handleHashChange();
                }
            });
        }

        // Initialize Custom Plan Sheet
        initCustomPlanSheet();

        // Initialize FCM if user logged in
        const userSession = localStorage.getItem('milkmanUser');
        if (userSession) {
            try {
                const u = JSON.parse(userSession);
                if (u.phone && window.initFirebaseFCM) {
                    window.initFirebaseFCM(u.phone);
                }
            } catch (e) { }
        }

        // Execute routing immediately on load
        handleHashChange();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }
})();
