/**
 * ZapUPI & YouPI Gateway Integration Module - Milkman Dairy
 * Dual Integration: ZapUPI Cashier (Auto-detect) + Direct UPI Fallback
 * Merchant Key: zapf29d648a94ef3ba979e02108efc4b0ac
 */

(function () {
    const GATEWAY_CONFIG = {
        zapKey: 'zapf29d648a94ef3ba979e02108efc4b0ac',
        fallbackVpa: 'vir523452@okhdfcbank',
        merchantName: 'Milkman Dairy Service',
        currency: 'INR'
    };

    let timerInterval = null;
    let zapPollingInterval = null;
    let currentAmount = 1;
    let currentTxnId = '';
    let isPaymentVerified = false;

    function getApiBase() {
        if (window.location.protocol === 'file:') return 'http://localhost:8080';
        return window.location.origin;
    }

    function getLoggedInUser() {
        try {
            const raw = localStorage.getItem('milkmanUser');
            if (raw) return JSON.parse(raw);
        } catch (e) {
            console.error('Error reading milkmanUser:', e);
        }
        return null;
    }

    function generateTxnId() {
        return 'MM' + Math.floor(100000 + Math.random() * 900000);
    }

    function buildUpiUri(amount, txnId, note) {
        const vpa = encodeURIComponent(GATEWAY_CONFIG.fallbackVpa);
        const name = encodeURIComponent(GATEWAY_CONFIG.merchantName);
        const tr = encodeURIComponent(txnId);
        const tn = encodeURIComponent(note || 'Milkman Dairy Test Order');
        const am = parseFloat(amount).toFixed(2);
        const cu = GATEWAY_CONFIG.currency;

        return `upi://pay?pa=${vpa}&pn=${name}&tr=${tr}&tn=${tn}&am=${am}&cu=${cu}`;
    }

    function loadTransactions() {
        const tableBody = document.getElementById('youpiTxnTableBody');
        const emptyState = document.getElementById('youpiTxnEmptyState');
        if (!tableBody) return;

        fetch(getApiBase() + '/api/youpi/transactions')
            .then(res => res.json())
            .then(data => {
                const txns = data.transactions || [];
                if (txns.length === 0) {
                    tableBody.innerHTML = '';
                    if (emptyState) emptyState.style.display = 'block';
                    return;
                }
                if (emptyState) emptyState.style.display = 'none';

                tableBody.innerHTML = txns.map(t => {
                    const isSuccess = t.status === 'SUCCESS' || t.status === 'Success';
                    const badgeBg = isSuccess ? '#ecfdf5' : '#fef2f2';
                    const badgeColor = isSuccess ? '#047857' : '#dc2626';
                    const badgeBorder = isSuccess ? '#a7f3d0' : '#fecaca';
                    const icon = isSuccess ? '✓' : '✕';

                    return `
                        <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.15s;">
                            <td style="padding: 10px 12px; font-size: 0.78rem; color: #64748b; white-space: nowrap;">
                                ${t.createdAt || 'N/A'}
                            </td>
                            <td style="padding: 10px 12px; font-size: 0.82rem; font-weight: 700; color: #0f172a;">
                                <div>${t.customerName || 'Guest User'}</div>
                                <div style="font-size: 0.72rem; color: #64748b; font-weight: 500;">${t.customerPhone || 'No Phone'}</div>
                            </td>
                            <td style="padding: 10px 12px; font-size: 0.88rem; font-weight: 800; color: #059669; white-space: nowrap;">
                                ₹${parseFloat(t.amount || 0).toFixed(2)}
                            </td>
                            <td style="padding: 10px 12px; font-size: 0.78rem; font-family: monospace; color: #475569;">
                                ${t.txnId || 'N/A'}
                            </td>
                            <td style="padding: 10px 12px; font-size: 0.78rem; font-family: monospace; color: #475569;">
                                ${t.utr || '—'}
                            </td>
                            <td style="padding: 10px 12px;">
                                <span style="display: inline-flex; align-items: center; gap: 4px; background: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; padding: 3px 8px; border-radius: 6px; font-size: 0.72rem; font-weight: 700;">
                                    <span>${icon}</span>
                                    <span>${t.status}</span>
                                </span>
                            </td>
                        </tr>
                    `;
                }).join('');
            })
            .catch(err => {
                console.error('Error loading transactions:', err);
            });
    }

    function openZapUPIModal(amount, customUser) {
        currentAmount = parseFloat(amount) || 1;
        currentTxnId = generateTxnId();
        isPaymentVerified = false;

        const modal = document.getElementById('youpiTestModal');
        if (!modal) {
            console.error('Payment Modal element not found');
            return;
        }

        // Reset views
        const checkoutView = document.getElementById('youpiCheckoutView');
        const successView = document.getElementById('youpiSuccessView');
        if (checkoutView) checkoutView.style.display = 'block';
        if (successView) successView.style.display = 'none';

        const user = customUser || getLoggedInUser();
        const amtEl = document.getElementById('youpiModalAmount');
        const txnEl = document.getElementById('youpiModalTxnId');
        const vpaEl = document.getElementById('youpiModalVpa');
        const qrImg = document.getElementById('youpiModalQrImg');
        const qrLoader = document.getElementById('youpiQrLoader');
        const utrInput = document.getElementById('youpiUtrInput');
        const utrStatus = document.getElementById('youpiUtrStatus');
        const userNotice = document.getElementById('youpiUserNotice');

        if (amtEl) amtEl.textContent = `₹${currentAmount.toFixed(2)}`;
        if (txnEl) txnEl.textContent = currentTxnId;
        if (vpaEl) vpaEl.textContent = GATEWAY_CONFIG.fallbackVpa;
        if (utrInput) {
            utrInput.value = '';
            utrInput.style.borderColor = '#cbd5e1';
        }
        if (utrStatus) {
            utrStatus.style.display = 'none';
            utrStatus.innerHTML = '';
        }

        // Display user notification notice
        if (userNotice) {
            if (user && user.phoneNumber) {
                userNotice.innerHTML = `
                    <span style="display:inline-flex;align-items:center;gap:5px;background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;">
                        <span>💬</span> WhatsApp receipt will go to: <strong>${user.phoneNumber}</strong>
                    </span>
                `;
            } else {
                userNotice.innerHTML = `
                    <span style="display:inline-flex;align-items:center;gap:5px;background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;">
                        <span>ℹ️</span> <a href="#login" onclick="window.YouPITest.close(); if(window.openAuthModal) window.openAuthModal();" style="color:#b45309;text-decoration:underline;">Login</a> to receive automatic WhatsApp receipt
                    </span>
                `;
            }
        }

        // Direct Fallback UPI Intent
        const upiString = buildUpiUri(currentAmount, currentTxnId, `Milkman #${currentTxnId}`);
        const autoPayBtn = document.getElementById('youpiAutoPayBtn');
        if (autoPayBtn) autoPayBtn.href = upiString;

        const gpayBtn = document.getElementById('youpiIntentGpay');
        const phonepeBtn = document.getElementById('youpiIntentPhonepe');
        const paytmBtn = document.getElementById('youpiIntentPaytm');
        const anyUpiBtn = document.getElementById('youpiIntentAny');

        if (gpayBtn) gpayBtn.href = upiString;
        if (phonepeBtn) phonepeBtn.href = upiString;
        if (paytmBtn) paytmBtn.href = upiString;
        if (anyUpiBtn) anyUpiBtn.href = upiString;

        // Load QR Code
        if (qrImg) {
            if (qrLoader) qrLoader.style.display = 'flex';
            qrImg.style.opacity = '0';
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiString)}`;
            qrImg.src = qrUrl;
            qrImg.onload = function () {
                if (qrLoader) qrLoader.style.display = 'none';
                qrImg.style.opacity = '1';
            };
            qrImg.onerror = function () {
                if (qrLoader) {
                    qrLoader.style.display = 'flex';
                    qrLoader.innerHTML = '<span style="color:#ef4444;font-size:0.78rem;">QR load failed. Tap UPI Apps below.</span>';
                }
            };
        }

        startTimer(300);

        // Try initiating ZapUPI order in background
        initiateZapUPIOrder(currentAmount, currentTxnId, user);

        modal.style.display = 'flex';
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });
        document.body.style.overflow = 'hidden';
    }

    function initiateZapUPIOrder(amount, orderId, user) {
        const zapNoticeEl = document.getElementById('youpiZapNotice');
        if (zapNoticeEl) {
            zapNoticeEl.style.display = 'block';
            zapNoticeEl.innerHTML = '<span style="color:#0284c7;">⚡ Connecting to ZapUPI Gateway...</span>';
        }

        fetch(getApiBase() + '/api/zapupi/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: amount,
                customerMobile: user ? user.phoneNumber : '7696880795',
                customerName: user ? (user.name || 'Valued Customer') : 'Guest Customer',
                remark: 'MilkmanOrder'
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success && (data.upiString || data.paymentUrl)) {
                    currentTxnId = data.orderId || orderId;
                    const txnEl = document.getElementById('youpiModalTxnId');
                    if (txnEl) txnEl.textContent = currentTxnId;

                    // Update live VPA and exact amount if provided by ZapUPI Cashier
                    if (data.vpa) {
                        const vpaEl = document.getElementById('youpiModalVpa');
                        if (vpaEl) vpaEl.textContent = data.vpa;
                    }
                    if (data.payAmount) {
                        const amtEl = document.getElementById('youpiModalAmount');
                        if (amtEl) amtEl.textContent = `₹${parseFloat(data.payAmount).toFixed(2)}`;
                    }

                    if (zapNoticeEl) {
                        zapNoticeEl.innerHTML = `
                            <div style="background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;padding:5px 10px;border-radius:8px;font-size:0.75rem;font-weight:700;display:flex;align-items:center;justify-content:center;gap:6px;">
                                <span>🟢 Asli Direct UPI Payment Ready (No Web Redirect)</span>
                            </div>
                        `;
                    }

                    // Direct UPI String for 1-tap app launch and true UPI QR scanning
                    const directUpiUri = data.upiString || buildUpiUri(data.payAmount || amount, currentTxnId, `Milkman #${currentTxnId}`);

                    // Update primary pay button to direct UPI intent (without target="_blank")
                    const autoPayBtn = document.getElementById('youpiAutoPayBtn');
                    if (autoPayBtn) {
                        autoPayBtn.href = directUpiUri;
                        autoPayBtn.removeAttribute('target');
                        autoPayBtn.innerHTML = `<span>⚡</span><span>Pay with UPI Apps (Instant PIN)</span><span>&rarr;</span>`;
                    }

                    // Update app shortcut buttons
                    const gpayBtn = document.getElementById('youpiIntentGpay');
                    const phonepeBtn = document.getElementById('youpiIntentPhonepe');
                    const paytmBtn = document.getElementById('youpiIntentPaytm');
                    const anyUpiBtn = document.getElementById('youpiIntentAny');

                    if (gpayBtn) gpayBtn.href = directUpiUri;
                    if (phonepeBtn) phonepeBtn.href = directUpiUri;
                    if (paytmBtn) paytmBtn.href = directUpiUri;
                    if (anyUpiBtn) anyUpiBtn.href = directUpiUri;

                    // Update QR Code to TRUE DIRECT UPI STRING (Scanner opens UPI App PIN screen, NOT website)
                    const qrImg = document.getElementById('youpiModalQrImg');
                    if (qrImg) {
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(directUpiUri)}`;
                        qrImg.src = qrUrl;
                    }

                    // Start automatic status polling every 2.5 seconds
                    startZapStatusPolling(data.orderId || currentTxnId, user);
                } else {
                    if (zapNoticeEl) {
                        const errMsg = data.message || 'No active cashier with UPI found';
                        zapNoticeEl.innerHTML = `
                            <div style="font-size:0.75rem;background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;padding:6px 10px;border-radius:8px;line-height:1.4;">
                                <strong>⚠️ ZapUPI Notice:</strong> ${errMsg}.<br>
                                <span style="font-size:0.7rem;color:#7f1d1d;">Link your BharatPe/UPI in <strong>ZapUPI Panel &rarr; Cashier Settings</strong> to enable full cashier mode. Direct UPI fallback active below!</span>
                            </div>
                        `;
                    }
                }
            })
            .catch(err => {
                console.error('Error initiating ZapUPI order:', err);
                if (zapNoticeEl) zapNoticeEl.style.display = 'none';
            });
    }

    function startZapStatusPolling(orderId, user) {
        if (zapPollingInterval) clearInterval(zapPollingInterval);

        zapPollingInterval = setInterval(() => {
            if (isPaymentVerified) {
                clearInterval(zapPollingInterval);
                return;
            }

            fetch(getApiBase() + '/api/zapupi/check-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: orderId,
                    customerPhone: user ? user.phoneNumber : '',
                    customerName: user ? (user.name || 'Valued Customer') : 'Customer'
                })
            })
                .then(res => res.json())
                .then(data => {
                    const st = String(data.status || '').toUpperCase();
                    if (st === 'SUCCESS' || st === 'COMPLETED') {
                        isPaymentVerified = true;
                        clearInterval(zapPollingInterval);
                        if (timerInterval) clearInterval(timerInterval);
                        loadTransactions();
                        showSuccessCelebrationScreen(data.utr || 'ZAP_AUTO', user);
                    }
                })
                .catch(err => console.error('ZapUPI status poll error:', err));
        }, 2500);
    }

    function cancelPayment(reason = 'CANCELLED') {
        if (isPaymentVerified) {
            closePaymentModal(false);
            return;
        }

        if (zapPollingInterval) {
            clearInterval(zapPollingInterval);
            zapPollingInterval = null;
        }

        const user = getLoggedInUser();
        fetch(getApiBase() + '/api/youpi/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: reason,
                amount: currentAmount,
                txnId: currentTxnId,
                customerPhone: user ? user.phoneNumber : '',
                customerName: user ? (user.name || 'Customer') : 'Guest User'
            })
        })
            .then(() => loadTransactions())
            .catch(e => console.error('Cancel notify error:', e));

        const utrStatus = document.getElementById('youpiUtrStatus');
        if (utrStatus) {
            utrStatus.style.display = 'block';
            utrStatus.style.background = '#fef2f2';
            utrStatus.style.color = '#dc2626';
            utrStatus.style.border = '1px solid #fecaca';
            utrStatus.innerHTML = `⚠️ Payment ${reason === 'EXPIRED' ? 'Session Expired' : 'Cancelled'}. WhatsApp notification dispatched.`;
        }

        setTimeout(() => {
            closePaymentModal(false);
            if (window.MilkmanPay && typeof window.MilkmanPay._onCancel === 'function') {
                try {
                    window.MilkmanPay._onCancel({
                        txnId: currentTxnId,
                        amount: currentAmount,
                        reason: reason
                    });
                } catch (cbErr) {
                    console.error('MilkmanPay._onCancel error:', cbErr);
                }
            }
        }, 1200);
    }

    function closePaymentModal(triggerCancel = true) {
        const modal = document.getElementById('youpiTestModal');
        if (!modal) return;

        if (zapPollingInterval) {
            clearInterval(zapPollingInterval);
            zapPollingInterval = null;
        }

        if (triggerCancel && !isPaymentVerified) {
            cancelPayment('CANCELLED');
            return;
        }

        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 180);

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    function startTimer(durationSeconds) {
        if (timerInterval) clearInterval(timerInterval);
        const timerEl = document.getElementById('youpiTimerDisplay');
        if (!timerEl) return;

        let timeLeft = durationSeconds;
        function updateTimer() {
            const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
            const s = (timeLeft % 60).toString().padStart(2, '0');
            timerEl.textContent = `${m}:${s}`;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                timerEl.textContent = 'Expired';
                timerEl.style.color = '#ef4444';
                cancelPayment('EXPIRED');
            }
            timeLeft--;
        }
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    function showSuccessCelebrationScreen(utr, user) {
        const checkoutView = document.getElementById('youpiCheckoutView');
        const successView = document.getElementById('youpiSuccessView');
        if (checkoutView) checkoutView.style.display = 'none';
        if (successView) {
            successView.style.display = 'block';

            const successAmt = document.getElementById('youpiSuccessAmount');
            const successTxn = document.getElementById('youpiSuccessTxnId');
            const successUtr = document.getElementById('youpiSuccessUtr');
            const successCustomer = document.getElementById('youpiSuccessCustomer');
            const successNotice = document.getElementById('youpiSuccessNotice');

            if (successAmt) successAmt.textContent = `₹${currentAmount.toFixed(2)}`;
            if (successTxn) successTxn.textContent = currentTxnId;
            if (successUtr) successUtr.textContent = utr;
            if (successCustomer) {
                successCustomer.textContent = user ? `${user.name || 'Valued Customer'} (${user.phoneNumber || 'Verified'})` : 'Guest Customer';
            }
            if (successNotice) {
                if (user && user.phoneNumber) {
                    successNotice.innerHTML = `📲 Official confirmation WhatsApp sent to <strong>${user.phoneNumber}</strong>!`;
                } else {
                    successNotice.innerHTML = `📲 Admin WhatsApp alert dispatched to Owner (7696880795)!`;
                }
            }

            if (window.MilkmanPay && typeof window.MilkmanPay._onSuccess === 'function') {
                try {
                    window.MilkmanPay._onSuccess({
                        txnId: currentTxnId,
                        utr: utr,
                        amount: currentAmount,
                        user: user
                    });
                } catch (cbErr) {
                    console.error('MilkmanPay._onSuccess error:', cbErr);
                }
            }
        }
    }

    function verifyUtr() {
        const utrInput = document.getElementById('youpiUtrInput');
        const statusEl = document.getElementById('youpiUtrStatus');
        const verifyBtn = document.getElementById('youpiVerifyBtn');
        if (!utrInput || !statusEl) return;

        const utr = utrInput.value.trim();
        if (!utr || !/^\d{12}$/.test(utr)) {
            statusEl.style.display = 'block';
            statusEl.style.background = '#fef2f2';
            statusEl.style.color = '#dc2626';
            statusEl.style.border = '1px solid #fecaca';
            statusEl.innerHTML = '⚠️ Please enter a valid 12-digit numeric UPI Ref / UTR number.';
            utrInput.style.borderColor = '#dc2626';
            return;
        }

        if (verifyBtn) {
            verifyBtn.disabled = true;
            verifyBtn.innerText = 'Verifying...';
        }
        statusEl.style.display = 'block';
        statusEl.style.background = '#eff6ff';
        statusEl.style.color = '#2563eb';
        statusEl.style.border = '1px solid #bfdbfe';
        statusEl.innerHTML = '⏳ Verifying payment & recording in database...';

        const user = getLoggedInUser();
        const payload = {
            status: 'SUCCESS',
            amount: currentAmount,
            txnId: currentTxnId,
            utr: utr,
            customerPhone: user ? user.phoneNumber : '',
            customerName: user ? (user.name || 'Valued Customer') : 'Guest Customer'
        };

        fetch(getApiBase() + '/api/youpi/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                isPaymentVerified = true;
                if (timerInterval) clearInterval(timerInterval);
                if (zapPollingInterval) clearInterval(zapPollingInterval);
                loadTransactions();
                showSuccessCelebrationScreen(utr, user);
            })
            .catch(err => {
                console.error('Verification notify error:', err);
                isPaymentVerified = true;
                if (timerInterval) clearInterval(timerInterval);
                if (zapPollingInterval) clearInterval(zapPollingInterval);
                loadTransactions();
                showSuccessCelebrationScreen(utr, user);
            });
    }

    function copyVpa() {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(GATEWAY_CONFIG.fallbackVpa).then(() => {
                const btn = document.getElementById('youpiCopyVpaBtn');
                if (btn) {
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<span>✓ Copied</span>';
                    btn.style.background = '#059669';
                    btn.style.color = '#ffffff';
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                        btn.style.color = '';
                    }, 2000);
                }
            }).catch(() => {
                alert('UPI ID: ' + GATEWAY_CONFIG.fallbackVpa);
            });
        } else {
            alert('UPI ID: ' + GATEWAY_CONFIG.fallbackVpa);
        }
    }

    // Expose global methods
    window.MilkmanPay = {
        open: function (options) {
            let amt = 1;
            let customUser = null;
            if (typeof options === 'number') {
                amt = options;
            } else if (typeof options === 'object' && options !== null) {
                amt = parseFloat(options.amount) || 1;
                if (options.phone || options.name) {
                    customUser = {
                        phoneNumber: options.phone,
                        name: options.name
                    };
                }
                window.MilkmanPay._onSuccess = typeof options.onSuccess === 'function' ? options.onSuccess : null;
                window.MilkmanPay._onCancel = typeof options.onCancel === 'function' ? options.onCancel : null;
            }
            openZapUPIModal(amt, customUser);
        },
        close: function () {
            closePaymentModal(true);
        },
        status: function () {
            return {
                verified: isPaymentVerified,
                txnId: currentTxnId,
                amount: currentAmount
            };
        }
    };

    window.YouPITest = {
        open: openZapUPIModal,
        close: closePaymentModal,
        cancelPayment: cancelPayment,
        verifyUtr: verifyUtr,
        copyVpa: copyVpa,
        loadTransactions: loadTransactions,
        config: GATEWAY_CONFIG
    };

    // Auto-init bindings on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function () {
        loadTransactions();

        const openBtn = document.getElementById('btnOpenYoupiTest');
        if (openBtn) {
            openBtn.addEventListener('click', function () {
                const selectedAmount = document.querySelector('input[name="youpiTestAmtRadio"]:checked');
                let amt = 1;
                if (selectedAmount) {
                    if (selectedAmount.value === 'custom') {
                        const customInput = document.getElementById('youpiCustomAmtInput');
                        amt = customInput ? parseFloat(customInput.value) || 1 : 1;
                    } else {
                        amt = parseFloat(selectedAmount.value) || 1;
                    }
                }
                openZapUPIModal(amt);
            });
        }

        const radios = document.querySelectorAll('input[name="youpiTestAmtRadio"]');
        radios.forEach(radio => {
            radio.addEventListener('change', function () {
                const customWrap = document.getElementById('youpiCustomAmtWrap');
                if (customWrap) {
                    customWrap.style.display = this.value === 'custom' ? 'block' : 'none';
                }
            });
        });
    });
})();
