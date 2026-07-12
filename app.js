// Initialize Lucide Icons and Page Systems
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initCountdown();
    initMobileNav();
    initScheduleTabs();
    initPaymentFlow();
    initNewsletterForm();
});

// 1. Countdown Timer (Closes in 3 Days)
function initCountdown() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3); // 3 days from now for demonstration

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate.getTime() - now;

        if (difference <= 0) {
            document.querySelector('.countdown-timer').innerHTML = "<h3>Registration Closed</h3>";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById('days').innerText = days.toString().padStart(2, '0');
        document.getElementById('hours').innerText = hours.toString().padStart(2, '0');
        document.getElementById('minutes').innerText = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').innerText = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// 2. Mobile Navigation Menu Toggle
function initMobileNav() {
    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-link, .nav-btn');

    toggleBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const icon = toggleBtn.querySelector('i');
        if (navLinks.classList.contains('active')) {
            icon.setAttribute('data-lucide', 'x');
        } else {
            icon.setAttribute('data-lucide', 'menu');
        }
        lucide.createIcons();
    });

    links.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                toggleBtn.querySelector('i').setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }
        });
    });
}

// 3. Interactive Schedule Day Tabs
function initScheduleTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const dayPanes = document.querySelectorAll('.schedule-day-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetDay = btn.getAttribute('data-day');

            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            dayPanes.forEach(pane => {
                if (pane.getAttribute('id') === targetDay) {
                    pane.classList.add('active');
                } else {
                    pane.classList.remove('active');
                }
            });
        });
    });
}

// 4. Registration and Multi-Step Payment Workflow
function initPaymentFlow() {
    const regForm = document.getElementById('regForm');
    const paymentModal = document.getElementById('paymentModal');
    const successModal = document.getElementById('successModal');
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
    
    // Tab switching controls
    const tabButtons = document.querySelectorAll('.pay-tab-btn');
    const paymentPanes = document.querySelectorAll('.payment-body .payment-pane');
    
    // Verification action elements
    const verifyUpiBtn = document.getElementById('verifyUpiBtn');
    const cardForm = document.getElementById('cardPaymentForm');
    
    // Success Dialog Elements
    const closeModalBtn = document.getElementById('closeModal');
    const modalName = document.getElementById('modalName');
    const modalCollege = document.getElementById('modalCollege');
    const modalReg = document.getElementById('modalReg');
    const modalPhone = document.getElementById('modalPhone');
    const modalTxn = document.getElementById('modalTxn');
    
    // Temporary variables to store details
    let userData = {
        name: '',
        college: '',
        regNo: '',
        phone: ''
    };

    // Card Input Auto-formatting helpers
    const cardNumber = document.getElementById('cardNumber');
    const cardExpiry = document.getElementById('cardExpiry');

    if (cardNumber) {
        cardNumber.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = v.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];

            for (let i = 0, len = match.length; i < len; i += 4) {
                parts.push(match.substring(i, i + 4));
            }

            if (parts.length > 0) {
                e.target.value = parts.join(' ');
            } else {
                e.target.value = v;
            }
        });
    }

    if (cardExpiry) {
        cardExpiry.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            if (v.length >= 2) {
                e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
            } else {
                e.target.value = v;
            }
        });
    }

    // Step 1: Submit Registrant Details -> Prompt Payment Gateway
    regForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Capture Registrant Fields
        userData.name = document.getElementById('fullName').value.trim();
        userData.phone = document.getElementById('userPhone').value.trim();
        userData.college = document.getElementById('userCollege').value.trim();
        userData.regNo = document.getElementById('userRegNo').value.trim();

        // Show checkout modal
        switchPaymentPane('upi');
        paymentModal.classList.add('active');
    });

    // Handle Payment Method Tab Switching
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.getAttribute('data-method');
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switchPaymentPane(method);
        });
    });

    // Helper to switch view states inside checkout
    function switchPaymentPane(paneId) {
        paymentPanes.forEach(pane => {
            if (pane.getAttribute('id') === paneId + 'Pane') {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }

    // Cancel Transaction button
    cancelPaymentBtn.addEventListener('click', () => {
        paymentModal.classList.remove('active');
    });

    // Step 2a: UPI Verification Click
    verifyUpiBtn.addEventListener('click', () => {
        processPaymentSimulation();
    });

    // Step 2b: Card Form Submission
    cardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        processPaymentSimulation();
    });

    // Step 3: Simulate Payment Handshake Delay
    function processPaymentSimulation() {
        // Toggle spinner view
        switchPaymentPane('loading');
        
        // Hide cancellation link during validation
        cancelPaymentBtn.style.display = 'none';

        setTimeout(() => {
            // Transaction success callback
            paymentModal.classList.remove('active');
            cancelPaymentBtn.style.display = 'inline-block'; // restore button
            
            // Build Final Receipt Ticket
            modalName.innerText = userData.name;
            modalCollege.innerText = userData.college;
            modalReg.innerText = userData.regNo;
            modalPhone.innerText = userData.phone;
            
            // Generate mock Txn code
            const randomCode = Math.floor(100000000 + Math.random() * 900000000);
            const txnId = `TXN-${randomCode}-GCEB`;
            modalTxn.innerText = txnId;

            // Save Registration to LocalStorage Database
            try {
                const registrations = JSON.parse(localStorage.getItem('cosmos_registrations')) || [];
                const newRegistration = {
                    name: userData.name,
                    email: document.getElementById('emailAddress').value.trim(),
                    phone: userData.phone,
                    college: userData.college,
                    regNo: userData.regNo,
                    txnId: txnId,
                    date: new Date().toLocaleString()
                };
                registrations.push(newRegistration);
                localStorage.setItem('cosmos_registrations', JSON.stringify(registrations));
            } catch (err) {
                console.error("Local storage save failed:", err);
            }

            // Open Success receipt modal
            successModal.classList.add('active');
            regForm.reset();
            cardForm.reset();
        }, 2500); // 2.5 second simulate processing lag
    }

    // Close Receipt dialog
    closeModalBtn.addEventListener('click', () => {
        successModal.classList.remove('active');
    });
}

// 5. Newsletter Submission Handler
function initNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const newsletterMsg = document.getElementById('newsletterMsg');

    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterEmail.value.trim();
        if (email) {
            newsletterMsg.innerText = "Subscribed to Cosmos '26 updates!";
            newsletterMsg.className = "newsletter-status success";
            newsletterForm.reset();
            
            setTimeout(() => {
                newsletterMsg.innerText = "";
                newsletterMsg.className = "newsletter-status";
            }, 3000);
        }
    });
}
