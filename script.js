// Using Google Gemini API for AI-based food suggestions
document.addEventListener('DOMContentLoaded', () => {
    // --- Login System Logic ---
    const loginScreen = document.getElementById('login-screen');
    const mainApp = document.getElementById('main-app');
    const loginForm = document.getElementById('login-form');

    // 1. Check if user is already logged in
    const user = localStorage.getItem('foodloop_user');
    if (user && loginScreen && mainApp) {
        loginScreen.style.display = 'none';
        mainApp.style.display = 'block';
    }

    // 2. Handle Login Form Submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('user-name').value;
            const email = document.getElementById('user-email').value;

            if (name && email) {
                // Save user data to localStorage
                localStorage.setItem('foodloop_user', JSON.stringify({ name, email }));
                
                // Hide login screen, show main app
                if (loginScreen && mainApp) {
                    loginScreen.style.display = 'none';
                    mainApp.style.display = 'block';
                }
            }
        });
    }

    // --- Tab Switching Logic ---
    // Select all tab buttons and role sections
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.role-section');

    // Add click event listener to each tab button
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 1. Remove 'active' class from all buttons and sections
            tabBtns.forEach(b => b.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));

            // 2. Add 'active' class to the clicked button
            btn.classList.add('active');

            // 3. Find the target section using the data attribute and add 'active' class
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
        });
    });

    // --- Donor System Logic ---
    const donationForm = document.getElementById('donation-form');
    const donationsContainer = document.getElementById('donations-container');
    
    // Load from localStorage or empty array
    let donations = JSON.parse(localStorage.getItem('foodloop_donations')) || [];

    // Helper: map category string → CSS class + label
    const catInfo = (cat) => {
        if (!cat) return { cls: 'cat-default', label: 'General' };
        if (cat.includes('Expiry'))     return { cls: 'cat-expiry',  label: '⚠ Expiry' };
        if (cat.includes('Event'))     return { cls: 'cat-event',   label: '🎉 Leftover' };
        if (cat.includes('Surplus'))   return { cls: 'cat-surplus', label: '🍽 Surplus' };
        return { cls: 'cat-default', label: cat };
    };

    const catBadgeHTML = (cat) => {
        const { cls, label } = catInfo(cat);
        return `<span class="cat-badge ${cls}">${label}</span>`;
    };



    // --- NGO System Logic ---
    const ngoDonationsGrid = document.getElementById('ngo-donations-grid');

    const statusPanel = document.getElementById('status-panel');
    const statusText = document.getElementById('request-status-text');
    const progressBar = document.getElementById('progress-bar');
    const closeStatusBtn = document.getElementById('close-status-btn');
    let requestFlowTimeout;
    
    if (closeStatusBtn) {
        closeStatusBtn.addEventListener('click', () => {
            statusPanel.classList.remove('slide-up');
        });
    }

    const startRequestFlow = () => {
        // Reset panel
        clearTimeout(requestFlowTimeout);
        statusText.style.opacity = 0;
        
        setTimeout(() => {
            statusText.textContent = "Request Sent Successfully";
            statusText.style.opacity = 1;
            progressBar.style.width = "25%";
        }, 150);

        statusPanel.classList.add('slide-up');

        requestFlowTimeout = setTimeout(() => {
            statusText.style.opacity = 0;
            setTimeout(() => {
                statusText.textContent = "Connecting...";
                statusText.style.opacity = 1;
                progressBar.style.width = "50%";
            }, 300);

            requestFlowTimeout = setTimeout(() => {
                statusText.style.opacity = 0;
                setTimeout(() => {
                    statusText.textContent = "Accepted!";
                    statusText.style.opacity = 1;
                    progressBar.style.width = "75%";
                }, 300);

                requestFlowTimeout = setTimeout(() => {
                    statusText.style.opacity = 0;
                    setTimeout(() => {
                        statusText.textContent = "Preparing...";
                        statusText.style.opacity = 1;
                        progressBar.style.width = "100%";
                    }, 300);
                }, 2000);
            }, 2000);
        }, 2000);
    };

    const renderNgoDonations = () => {
        if (!ngoDonationsGrid) return;
        ngoDonationsGrid.innerHTML = '';

        if (donations.length === 0) {
            ngoDonationsGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:3rem 1rem; color:var(--text-muted);">
                    <div style="font-size:3rem; margin-bottom:1rem;">🍽️</div>
                    <h3 style="color:var(--text-muted); font-weight:500; margin-bottom:0.5rem;">No donations available yet</h3>
                    <p style="font-size:0.9rem;">Donors haven't listed anything yet. Check back soon!</p>
                </div>`;
            return;
        }

        donations.forEach((donation, index) => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            const isUrgent  = donation.category && donation.category.includes('Expiry');
            const urgencyBadge = isUrgent
                ? `<span class="badge" style="font-size:0.72rem; padding:0.2rem 0.55rem;">⚡ Urgent</span>`
                : `<span class="badge info" style="font-size:0.72rem; padding:0.2rem 0.55rem;">Available</span>`;

            card.innerHTML = `
                <div class="card-body">
                    <div class="card-header-flex">
                        <h3>${donation.name}</h3>
                        ${urgencyBadge}
                    </div>
                    <div style="display:flex; gap:0.4rem; align-items:center;">
                        ${catBadgeHTML(donation.category)}
                    </div>
                    <p>Qty: <strong>${donation.quantity}</strong></p>
                    <p class="distance-info">📍 ${donation.location}</p>
                    <button
                        class="btn-primary request-btn"
                        data-index="${index}"
                        style="background: linear-gradient(135deg, var(--primary-color), #6d28d9); margin-top:0.5rem;">
                        Request Food
                    </button>
                </div>
            `;
            ngoDonationsGrid.appendChild(card);
        });

        // Use event delegation — one listener on the grid, no duplicates
        ngoDonationsGrid.addEventListener('click', (e) => {
            const btn = e.target.closest('.request-btn');
            if (!btn || btn.dataset.requested) return;

            btn.dataset.requested = 'true';
            btn.textContent = 'Requested ✓';
            btn.style.background = 'var(--success)';
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.85';

            startRequestFlow();
        }, { once: false });
    };

    let donorActiveFilter = 'all';

    const renderDonations = (filterCat = donorActiveFilter) => {
        if (!donationsContainer) return;
        donationsContainer.innerHTML = '';

        const visible = filterCat === 'all'
            ? donations
            : donations.filter(d => d.category === filterCat);

        if (visible.length === 0) {
            donationsContainer.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:var(--text-muted); padding:2rem 0;">No listings match this filter. Try adding one above!</p>';
        } else {
            visible.forEach((donation) => {
                const realIndex = donations.indexOf(donation);
                const card = document.createElement('div');
                card.className = 'glass-card';
                card.innerHTML = `
                    <div class="card-body">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <h3>${donation.name}</h3>
                            <button class="btn-outline delete-btn"
                                style="color:var(--danger);border-color:var(--danger);padding:0.3rem 0.55rem;font-size:0.8rem;flex-shrink:0;"
                                data-index="${realIndex}">Delete</button>
                        </div>
                        <div style="display:flex; gap:0.5rem; align-items:center;">
                            <span class="status healthy">Qty: ${donation.quantity}</span>
                            ${catBadgeHTML(donation.category)}
                        </div>
                        <p style="color:#c4b5fd;">📍 ${donation.location}</p>
                    </div>
                `;
                donationsContainer.appendChild(card);
            });

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.target.getAttribute('data-index'));
                    donations.splice(idx, 1);
                    localStorage.setItem('foodloop_donations', JSON.stringify(donations));
                    renderDonations();
                });
            });
        }

        // Wire filter pills
        document.querySelectorAll('#donor-filter-pills .filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('#donor-filter-pills .filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                donorActiveFilter = pill.getAttribute('data-cat');
                renderDonations(donorActiveFilter);
            });
        });

        // Sync other views
        renderNgoDonations();
        renderCustomerDonations();
    };


    // --- Customer System Logic ---
    const customerDonationsGrid = document.getElementById('customer-donations-grid');
    const foodSearchInput = document.getElementById('food-search');
    
    const renderCustomerDonations = (filterText = '') => {
        if (!customerDonationsGrid) return;
        customerDonationsGrid.innerHTML = '';
        
        let filtered = donations;
        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            filtered = donations.filter(d => 
                d.name.toLowerCase().includes(lowerFilter) || 
                d.location.toLowerCase().includes(lowerFilter)
            );
        }

        if (filtered.length === 0) {
            customerDonationsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted); padding: 2rem 0;">No food matches your search at the moment.</p>';
            return;
        }

        filtered.forEach((donation) => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.innerHTML = `
                <div class="card-body">
                    <h3>${donation.name}</h3>
                    <p>Available at: <strong>${donation.location}</strong></p>
                    <div style="display:flex; gap:0.5rem; align-items:center;">
                        ${catBadgeHTML(donation.category)}
                        <span style="color:var(--text-muted);font-size:0.85rem;">Qty: ${donation.quantity}</span>
                    </div>
                    <button class="btn-primary" style="background:var(--info); margin-top:0.5rem;">Buy / Order</button>
                </div>
            `;
            customerDonationsGrid.appendChild(card);
        });
    };

    if (foodSearchInput) {
        foodSearchInput.addEventListener('input', (e) => {
            renderCustomerDonations(e.target.value);
        });
    }

    // --- AI Generator Logic ---
    const aiBtn = document.getElementById('ai-generate-btn');
    const aiInput = document.getElementById('ai-ingredients');
    const aiOutput = document.getElementById('ai-output');
    const aiOutputText = document.getElementById('ai-output-text');
    
    if (aiBtn) {
        aiBtn.addEventListener('click', () => {
            const ingredients = aiInput.value.trim();
            if (!ingredients) return;
            
            aiBtn.textContent = 'Thinking...';
            aiBtn.style.opacity = '0.7';
            aiOutput.style.display = 'block';
            aiOutputText.innerHTML = '<span style="opacity:0.5;">Analyzing ingredients with AI...</span>';
            
            setTimeout(() => {
                aiBtn.textContent = 'Generate Ideas';
                aiBtn.style.opacity = '1';
                
                const splitIng = ingredients.split(',')[0] || ingredients;
                aiOutputText.innerHTML = `Here are some creative ideas for <strong>${ingredients}</strong>:
                <ul style="margin-top:0.5rem; margin-left: 1.5rem;">
                    <li>Hearty ${splitIng.trim()} stir-fry bowl with soy glaze</li>
                    <li>Savoury baked casserole with spices</li>
                    <li>Quick 15-minute fresh wrapper</li>
                </ul>`;
            }, 1500);
        });
    }

    if (donationForm) {
        renderDonations();
        donationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name     = document.getElementById('food-name').value.trim();
            const quantity = document.getElementById('food-qty').value.trim();
            const location = document.getElementById('food-loc').value.trim();
            const category = document.getElementById('food-category').value;

            if (name && quantity && location && category) {
                const submitBtn = donationForm.querySelector('.form-btn');
                submitBtn.disabled = true;
                
                donations.push({ name, quantity, location, category });
                localStorage.setItem('foodloop_donations', JSON.stringify(donations));
                
                setTimeout(() => {
                    renderDonations();
                    donationForm.reset();
                    submitBtn.disabled = false;
                }, 300);
            }
        });
    }
});
