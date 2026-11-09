// ==========================================
// MILKMAN DAIRY - PRODUCT BOTTOM SHEET & SLIDER MODULE (slider.js)
// Handles multi-photo carousel, thumbnail preview, and bottom sheet
// ==========================================

(function() {
    'use strict';

    let currentSheetProduct = null;
    let currentSheetImages = [];
    let currentImageIndex = 0;
    let currentSheetQty = 1;

    function updateSheetMainImage(index) {
        if (!currentSheetImages || currentSheetImages.length === 0) return;
        if (index < 0) index = currentSheetImages.length - 1;
        if (index >= currentSheetImages.length) index = 0;
        currentImageIndex = index;

        const mainImg = document.getElementById('productSheetMainImage');
        const badge = document.getElementById('galleryCounterBadge');
        const prevBtn = document.getElementById('galleryPrevBtn');
        const nextBtn = document.getElementById('galleryNextBtn');

        if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
                mainImg.src = currentSheetImages[currentImageIndex];
                mainImg.style.opacity = '1';
            }, 100);
        }

        if (badge) {
            badge.innerText = `${currentImageIndex + 1} / ${currentSheetImages.length}`;
            badge.style.display = currentSheetImages.length > 1 ? 'block' : 'none';
        }

        if (prevBtn) prevBtn.style.display = currentSheetImages.length > 1 ? 'flex' : 'none';
        if (nextBtn) nextBtn.style.display = currentSheetImages.length > 1 ? 'flex' : 'none';

        // Update active thumbnail
        document.querySelectorAll('.gallery-thumb-item').forEach((thumb, idx) => {
            if (idx === currentImageIndex) thumb.classList.add('active');
            else thumb.classList.remove('active');
        });
    }

    function updateSheetQty(newQty) {
        if (newQty < 1) newQty = 1;
        currentSheetQty = newQty;
        const qtyValEl = document.getElementById('sheetQtyVal');
        const addPriceEl = document.getElementById('sheetAddCartPrice');
        if (qtyValEl) qtyValEl.innerText = currentSheetQty;
        if (addPriceEl && currentSheetProduct) {
            addPriceEl.innerText = '₹' + (currentSheetProduct.price * currentSheetQty);
        }
    }

    function openProductBottomSheet(product) {
        currentSheetProduct = product;
        currentSheetQty = 1;

        // Parse images safely
        let images = [];
        if (product.images) {
            try {
                images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
            } catch (e) {
                images = [product.images];
            }
        }
        if (!Array.isArray(images) || images.length === 0) {
            let singleImg = product.image_url;
            if (!singleImg && product.image_base64) {
                singleImg = product.image_base64.startsWith('data:') 
                    ? product.image_base64 
                    : `data:image/jpeg;base64,${product.image_base64}`;
            }
            images = [singleImg || 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=400'];
        }
        currentSheetImages = images;
        currentImageIndex = 0;

        // Populate Details
        const titleEl = document.getElementById('productSheetTitle');
        const priceEl = document.getElementById('productSheetPrice');
        const unitEl = document.getElementById('productSheetUnit');
        const descEl = document.getElementById('productSheetDesc');
        const stockEl = document.getElementById('productSheetStockBadge');

        if (titleEl) titleEl.innerText = product.name;
        if (priceEl) priceEl.innerText = '₹' + product.price;
        if (unitEl) unitEl.innerText = product.quantity ? '/ ' + product.quantity : '/ 1 Litre';
        if (descEl) descEl.innerText = product.description || '100% Pure, farm fresh and natural dairy product, delivered with cold-chain sanitized care.';

        if (stockEl) {
            const inStock = product.available_stock === undefined || product.available_stock === null || product.available_stock > 0;
            stockEl.innerText = inStock ? 'In Stock • Farm Fresh' : 'Out of Stock';
            stockEl.style.color = inStock ? '#38bdf8' : '#f87171';
        }

        // Render Thumbnails
        const strip = document.getElementById('galleryThumbnailsStrip');
        if (strip) {
            if (currentSheetImages.length > 1) {
                strip.style.display = 'flex';
                strip.innerHTML = currentSheetImages.map((src, idx) => `
                    <div class="gallery-thumb-item ${idx === 0 ? 'active' : ''}" onclick="window.setSheetImageIndex ? window.setSheetImageIndex(${idx}) : null">
                        <img src="${src}" alt="Thumb ${idx + 1}">
                    </div>
                `).join('');
            } else {
                strip.style.display = 'none';
                strip.innerHTML = '';
            }
        }

        // Initial image and qty
        updateSheetMainImage(0);
        updateSheetQty(1);

        // Open bottom sheet
        const backdrop = document.getElementById('productBottomSheetBackdrop');
        const sheet = document.getElementById('productBottomSheet');
        if (backdrop) {
            backdrop.style.display = 'block';
            requestAnimationFrame(() => backdrop.classList.add('active'));
        }
        if (sheet) {
            sheet.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => sheet.classList.add('active'));
        }
        document.body.style.overflow = 'hidden';
    }

    function closeProductBottomSheet() {
        const backdrop = document.getElementById('productBottomSheetBackdrop');
        const sheet = document.getElementById('productBottomSheet');
        if (backdrop) backdrop.classList.remove('active');
        if (sheet) {
            sheet.classList.remove('active');
            sheet.setAttribute('aria-hidden', 'true');
        }
        setTimeout(() => {
            if (backdrop) backdrop.style.display = 'none';
            document.body.style.overflow = '';
        }, 360);
    }

    // Expose helpers globally
    window.openProductBottomSheet = openProductBottomSheet;
    window.closeProductBottomSheet = closeProductBottomSheet;
    window.setSheetImageIndex = (idx) => updateSheetMainImage(idx);
    window.updateSheetQty = updateSheetQty;

    function initSliderControls() {
        // Prev/Next buttons
        document.getElementById('galleryPrevBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            updateSheetMainImage(currentImageIndex - 1);
        });
        document.getElementById('galleryNextBtn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            updateSheetMainImage(currentImageIndex + 1);
        });

        // Close listeners
        document.getElementById('productBottomSheetBackdrop')?.addEventListener('click', closeProductBottomSheet);
        document.getElementById('productSheetCloseBtn')?.addEventListener('click', closeProductBottomSheet);
        document.getElementById('productSheetHandle')?.addEventListener('click', closeProductBottomSheet);

        // Quantity Minus/Plus
        document.getElementById('sheetQtyMinus')?.addEventListener('click', () => {
            updateSheetQty(currentSheetQty - 1);
        });
        document.getElementById('sheetQtyPlus')?.addEventListener('click', () => {
            updateSheetQty(currentSheetQty + 1);
        });

        // Sheet Add to Cart button
        document.getElementById('sheetAddToCartBtn')?.addEventListener('click', () => {
            if (!currentSheetProduct) return;
            const userSession = localStorage.getItem('milkmanUser');
            if (!userSession) {
                if (window.customAlert) {
                    window.customAlert("Login Required", "Please login first to add items to cart!");
                } else {
                    alert("Please login first to add items to cart!");
                }
                window.location.hash = 'login';
                if (window.showAuthStep) window.showAuthStep(1);
                closeProductBottomSheet();
                return;
            }

            let cart = JSON.parse(localStorage.getItem('milkmanCart') || '[]');
            let existing = cart.find(i => i.productId === currentSheetProduct.id);
            const coverImage = (currentSheetImages && currentSheetImages[0]) || currentSheetProduct.image_url || '';
            const unit = currentSheetProduct.quantity || '1 Litre';

            if (existing) {
                existing.quantity += currentSheetQty;
                existing.imageUrl = coverImage || existing.imageUrl;
                existing.unit = unit || existing.unit;
            } else {
                cart.push({
                    productId: currentSheetProduct.id,
                    productName: currentSheetProduct.name,
                    price: parseInt(currentSheetProduct.price),
                    quantity: currentSheetQty,
                    imageUrl: coverImage,
                    unit: unit
                });
            }

            localStorage.setItem('milkmanCart', JSON.stringify(cart));
            if (window.updateCartCount) window.updateCartCount();

            // Animate button feedback
            const addBtn = document.getElementById('sheetAddToCartBtn');
            if (addBtn) {
                const originalContent = addBtn.innerHTML;
                addBtn.innerHTML = '<span>✅ Added to Cart!</span>';
                addBtn.style.background = '#10B981';

                setTimeout(() => {
                    addBtn.innerHTML = originalContent;
                    addBtn.style.background = '';
                    closeProductBottomSheet();
                }, 500);
            } else {
                closeProductBottomSheet();
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSliderControls);
    } else {
        initSliderControls();
    }
})();

