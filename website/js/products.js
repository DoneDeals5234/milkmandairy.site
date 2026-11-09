// ==========================================
// MILKMAN DAIRY - PRODUCTS & CART ACTION MODULE (products.js)
// Handles product catalog fetching, product cards, and Cart additions
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

    // Helper to format image
    function resolveProductImage(product) {
        if (product.images) {
            try {
                const parsed = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) return parsed[0];
            } catch (e) { }
        }
        if (product.image_url && product.image_url.trim()) {
            return product.image_url;
        }
        if (product.image_base64 && product.image_base64.trim()) {
            return product.image_base64.startsWith('data:') 
                ? product.image_base64 
                : `data:image/jpeg;base64,${product.image_base64}`;
        }
        return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400';
    }

    // --- Fly to Cart Animation Function ---
    function playFlyToCartAnimation(btnEl) {
        try {
            const headerCartBadge = document.getElementById('headerCartBadge');
            const headerCartBtn = document.getElementById('headerCartBtn');
            const navCart = document.getElementById('navCart');
            const cartCountBadge = document.getElementById('cartCount');

            // Determine active target element
            let targetEl = null;
            if (headerCartBtn && headerCartBtn.offsetParent !== null) {
                targetEl = headerCartBadge || headerCartBtn;
            } else if (navCart && navCart.offsetParent !== null) {
                targetEl = cartCountBadge || navCart;
            } else if (headerCartBtn) {
                targetEl = headerCartBtn;
            }

            if (!targetEl) {
                if (window.updateCartCount) window.updateCartCount();
                return;
            }

            // Find parent product card / section to locate product image
            const card = btnEl.closest('.product-card') ||
                btnEl.closest('.product-card-new') ||
                btnEl.closest('.plan-horizontal-ribbon') ||
                btnEl.closest('.promo-ribbon') ||
                btnEl;

            const img = card ? card.querySelector('img') : null;
            const startRect = (img && img.getBoundingClientRect().width > 0) ? img.getBoundingClientRect() : btnEl.getBoundingClientRect();
            const targetRect = targetEl.getBoundingClientRect();

            // Sizing for the flying circle
            const size = Math.min(Math.max(startRect.width * 0.4, 45), 75);
            const startX = startRect.left + (startRect.width / 2) - (size / 2);
            const startY = startRect.top + (startRect.height / 2) - (size / 2);

            // Calculate trajectory distance to target center
            const targetCenterX = targetRect.left + (targetRect.width / 2);
            const targetCenterY = targetRect.top + (targetRect.height / 2);
            const deltaX = targetCenterX - (startX + size / 2);
            const deltaY = targetCenterY - (startY + size / 2);

            // Create flyer DOM element
            const flyer = document.createElement('div');
            flyer.className = 'fly-to-cart-item';
            flyer.style.width = `${size}px`;
            flyer.style.height = `${size}px`;
            flyer.style.left = `${startX}px`;
            flyer.style.top = `${startY}px`;
            flyer.style.setProperty('--target-x', `${deltaX}px`);
            flyer.style.setProperty('--target-y', `${deltaY}px`);

            let flyerSrc = '';
            const pId = btnEl.getAttribute('data-id');
            if (pId === 'promo_shobha' || btnEl.closest('.promo-ribbon')) {
                flyerSrc = 'assets/shobha_toilet_cleaner.png';
            } else if (img && img.src) {
                flyerSrc = img.src;
            }

            if (flyerSrc) {
                const flyImg = document.createElement('img');
                flyImg.src = flyerSrc;
                flyImg.alt = "Adding to cart";
                flyer.appendChild(flyImg);
            } else {
                flyer.innerHTML = '<span class="fly-fallback-icon">🥛</span>';
            }

            document.body.appendChild(flyer);

            // On impact with Cart (820ms duration)
            setTimeout(() => {
                flyer.remove();

                if (window.updateCartCount) window.updateCartCount();

                // Trigger badge pop & glow
                [headerCartBadge, cartCountBadge].forEach(badge => {
                    if (badge && badge.offsetParent !== null) {
                        badge.classList.remove('cart-pop-active');
                        void badge.offsetWidth;
                        badge.classList.add('cart-pop-active');
                    }
                });

                // Trigger button bounce
                [headerCartBtn, navCart].forEach(btn => {
                    if (btn && btn.offsetParent !== null) {
                        btn.classList.remove('nav-cart-bounce');
                        void btn.offsetWidth;
                        btn.classList.add('nav-cart-bounce');
                    }
                });
            }, 820);
        } catch (err) {
            console.error("Fly to cart error:", err);
            if (window.updateCartCount) window.updateCartCount();
        }
    }

    function attachSubscribeListeners() {
        document.querySelectorAll('.btn-add-cart').forEach(btn => {
            if (btn.dataset.hasCartListener) return;
            btn.dataset.hasCartListener = 'true';

            btn.addEventListener('click', (e) => {
                const userSession = localStorage.getItem('milkmanUser');
                if (!userSession) {
                    if (window.customAlert) {
                        window.customAlert("Login Required", "Please login first to add items to cart!");
                    } else {
                        alert("Please login first to add items to cart!");
                    }
                    if (window.openLoginModal) {
                        window.openLoginModal();
                    } else {
                        window.location.hash = 'login';
                    }
                    return;
                }

                const btnEl = e.target.closest('.btn-add-cart') || e.currentTarget;
                if (!btnEl) return;

                const productId = btnEl.getAttribute('data-id');
                const productName = btnEl.getAttribute('data-name');
                const price = btnEl.getAttribute('data-price');

                // Extract card image and unit for cart item display
                const parentCard = btnEl.closest('.product-card') ||
                    btnEl.closest('.product-card-new') ||
                    btnEl.closest('.plan-horizontal-ribbon') ||
                    btnEl.closest('.promo-ribbon');
                const imgEl = parentCard ? parentCard.querySelector('img') : null;
                const unitEl = parentCard ? parentCard.querySelector('.product-unit-new') : null;

                let imageUrl = '';
                if (productId === 'promo_shobha' || (productName && productName.toLowerCase().includes('toilet cleaner'))) {
                    imageUrl = 'assets/shobha_toilet_cleaner.png';
                } else if (imgEl && imgEl.src) {
                    imageUrl = imgEl.src;
                } else {
                    if (productId === 'plan_cow' || productId === 'plan_cow_half') imageUrl = 'assets/cow_milk_plan.jpg';
                    else if (productId === 'plan_buffalo' || productId === 'plan_buffalo_half') imageUrl = 'assets/buffalo_milk_plan.png';
                }

                const unit = (productId === 'promo_shobha' || (productName && productName.toLowerCase().includes('toilet cleaner')))
                    ? '500 ml'
                    : (unitEl ? unitEl.innerText.trim() : (productId.includes('half') ? '30 Days / 500ml' : (productId.startsWith('plan_') ? '30 Days / 1L' : '1 Litre')));

                let cart = JSON.parse(localStorage.getItem('milkmanCart') || '[]');
                let existing = cart.find(i => i.productId === productId);
                if (existing) {
                    existing.quantity += 1;
                    existing.imageUrl = imageUrl || existing.imageUrl;
                    existing.unit = unit || existing.unit;
                } else {
                    cart.push({ productId, productName, price: parseInt(price), quantity: 1, imageUrl, unit });
                }
                localStorage.setItem('milkmanCart', JSON.stringify(cart));

                if (btnEl.classList.contains('btn-book-plan')) {
                    if (window.updateCartCount) window.updateCartCount();
                    if (window.location.hash === '#cart') {
                        if (window.handleHashChange) window.handleHashChange();
                    } else {
                        window.location.hash = 'cart';
                    }
                    return;
                }

                // Play smooth Fly-to-Cart animation
                playFlyToCartAnimation(btnEl);

                // Button visual feedback
                const ogHtml = btnEl.innerHTML;
                btnEl.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px;">✓ Added!</span>`;
                btnEl.style.pointerEvents = 'none';
                setTimeout(() => {
                    btnEl.innerHTML = ogHtml;
                    btnEl.style.pointerEvents = 'auto';
                }, 1100);
            });
        });
    }

    async function loadProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        const API_BASE = getApiBase();

        try {
            const res = await fetch(API_BASE + '/api/products');
            const data = await res.json();

            if (data && data.success && data.products) {
                productsGrid.innerHTML = ''; // clear loading skeleton

                if (data.products.length === 0) {
                    productsGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1/-1; color: var(--text-light); padding: 40px 0;">No products available yet.</p>';
                    return;
                }

                data.products.forEach(product => {
                    let images = [];
                    if (product.images) {
                        try {
                            images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                        } catch (e) {
                            images = [product.images];
                        }
                    }
                    if (!Array.isArray(images) || images.length === 0) {
                        if (product.image_url) images = [product.image_url];
                        else if (product.image_base64) {
                            const b64 = product.image_base64.startsWith('data:') ? product.image_base64 : `data:image/jpeg;base64,${product.image_base64}`;
                            images = [b64];
                        } else {
                            images = [];
                        }
                    }

                    const imgCount = images.length;
                    const primaryImg = images[0] || resolveProductImage(product);

                    const card = document.createElement('div');
                    card.className = 'product-card';
                    card.style.position = 'relative';
                    card.style.cursor = 'pointer';

                    card.innerHTML = `
                        ${imgCount > 1 ? `<div class="card-multi-img-badge"><span>📸 ${imgCount} Photos</span></div>` : ''}
                        <img src="${primaryImg}" alt="${product.name}" class="product-image" loading="lazy">
                        <h3 class="product-title" style="text-align: left;">${product.name}</h3>
                        <p class="product-desc" style="text-align: left;">${product.description || ''}</p>
                        
                        <div class="product-features">
                            <div class="product-feature">
                                <div class="feature-icon icon-green">
                                    <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21.5c-5.25 0-9.5-4.25-9.5-9.5 0-2 1.5-6.5 4.5-9.5 1-1 2.5-1 4.5 1.5 1.5 2 2.5 4.5 3.5 8 1 3.5-1 7.5-3 9.5z"/></svg>
                                </div>
                                <div class="feature-text">100% Pure</div>
                            </div>
                            <div class="product-feature">
                                <div class="feature-icon icon-blue">
                                    <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
                                </div>
                                <div class="feature-text">Rich Nutrition</div>
                            </div>
                            <div class="product-feature">
                                <div class="feature-icon icon-purple">
                                    <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                </div>
                                <div class="feature-text">No Added Preservatives</div>
                            </div>
                            <div class="product-feature">
                                <div class="feature-icon icon-orange">
                                    <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 10h11M16 10l3 3v4M5 17h11M7 17a2 2 0 11-4 0 2 2 0 014 0zm11 0a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                </div>
                                <div class="feature-text">Fast Delivery</div>
                            </div>
                        </div>

                        <div class="product-footer">
                            <div class="product-price-new">₹${product.price}</div>
                            <div class="product-unit-new">${product.quantity || '1 Litre'}</div>
                            
                            <button class="btn-add-cart-new btn-add-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
                                <svg viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                                Add to Cart
                            </button>
                        </div>
                    `;

                    // Click on card opens half-screen bottom sheet with multi-image gallery
                    card.addEventListener('click', (e) => {
                        if (e.target.closest('.btn-add-cart')) return;
                        if (window.openProductBottomSheet) {
                            window.openProductBottomSheet(product);
                        }
                    });

                    productsGrid.appendChild(card);
                });

                attachSubscribeListeners();
            } else {
                throw new Error("Invalid response format");
            }
        } catch (e) {
            console.error('Failed to load products:', e);
            if (productsGrid) {
                productsGrid.innerHTML = `
                    <div style="text-align:center; width:100%; grid-column: 1/-1; padding: 40px 10px;">
                        <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 12px;">Connecting to dairy catalog...</p>
                        <button onclick="window.loadProducts ? window.loadProducts() : location.reload()" 
                                style="background: var(--primary-color); color: #fff; border: none; padding: 8px 18px; border-radius: 20px; font-weight: 700; cursor: pointer;">
                            🔄 Retry Loading
                        </button>
                    </div>
                `;
            }
        }
    }

    // Expose helpers globally
    window.loadProducts = loadProducts;
    window.attachSubscribeListeners = attachSubscribeListeners;
    window.playFlyToCartAnimation = playFlyToCartAnimation;

    function initProducts() {
        attachSubscribeListeners();
        loadProducts();

        // Make entire Plan Horizontal Ribbon Card clickable as a Button
        document.querySelectorAll('.plan-horizontal-ribbon').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('a')) {
                    const btn = card.querySelector('.btn-book-plan');
                    if (btn) btn.click();
                }
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProducts);
    } else {
        initProducts();
    }
})();
