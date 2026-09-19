document.addEventListener("DOMContentLoaded", () => {
    const serviceCards = document.querySelectorAll(".service-card");
    const searchInput = document.getElementById("searchService");
    const filterBtns = document.querySelectorAll(".s-filter-btn");

    // SEARCH FUNCTIONALITY
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();

            serviceCards.forEach(card => {
                const title = card.querySelector("h3").innerText.toLowerCase();
                const desc = card.querySelector(".service-desc").innerText.toLowerCase();

                if (title.includes(query) || desc.includes(query)) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    }

    // CATEGORY FILTER FUNCTIONALITY
    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const filterValue = btn.getAttribute("data-filter");

            serviceCards.forEach(card => {
                const category = card.getAttribute("data-category");

                if (filterValue === "all" || category === filterValue) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // MOBILE MENU TOGGLE
    const mobileToggle = document.getElementById("mobileToggle");
    const navLinks = document.getElementById("navLinks");

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }
});

// SCROLL & AUTO SELECT SERVICE IN CYBER TERMINAL
function openCyberTerminal(serviceTitle, servicePrice, deliveryTime) {
    const selectedInput = document.getElementById('selected_service');
    const prevPkg = document.getElementById('prevPkg');
    const prevPrice = document.getElementById('prevPrice');
    const prevTime = document.getElementById('prevTime');

    if (selectedInput) selectedInput.value = serviceTitle;
    if (prevPkg) prevPkg.innerText = serviceTitle;
    if (prevPrice) prevPrice.innerText = servicePrice;
    if (prevTime) prevTime.innerText = deliveryTime;

    const terminalSection = document.getElementById('order-terminal');
    if (terminalSection) {
        terminalSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// UPDATE LIVE HUD PREVIEW ON TYPING
function updateLivePreview() {
    const name = document.getElementById('client_name').value;
    const email = document.getElementById('client_email').value;
    const phone = document.getElementById('client_phone').value;

    document.getElementById('prevName').innerText = name.trim() !== '' ? name : '---';
    document.getElementById('prevEmail').innerText = email.trim() !== '' ? email : '---';
    document.getElementById('prevPhone').innerText = phone.trim() !== '' ? phone : '---';

    document.getElementById('hudStatus').innerText = 'DATA INPUT DETECTED';
    document.getElementById('hudStatus').style.color = '#00f0ff';
}

// FORM TRANSMISSION TO EMAIL VIA FORMSPREE
const cyberForm = document.getElementById('futuristicOrderForm');
if (cyberForm) {
    cyberForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        const btn = document.getElementById('cyberSubmitBtn');
        btn.innerHTML = 'TRANSMITTING DATA <i class="fa-solid fa-spinner fa-spin"></i>';

        const formData = new FormData(cyberForm);

        try {
            const response = await fetch(cyberForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                btn.innerHTML = 'TRANSMISSION SUCCESSFUL <i class="fa-solid fa-circle-check"></i>';
                alert('🚀 [SUCCESS] আপনার অর্ডারের সকল তথ্য MR MOIN-এর ইমেইলে পৌছে গিয়েছে!');
                cyberForm.reset();
                updateLivePreview();
            } else {
                alert('❌ [ERROR] মেসেজ পাঠাতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
            }
        } catch (err) {
            alert('⚠️ [NETWORK ERROR] ইন্টারনেট সংযোগ চেক করুন।');
        } finally {
            setTimeout(() => {
                btn.innerHTML = 'TRANSMIT SPECIFICATIONS <i class="fa-solid fa-paper-plane"></i>';
            }, 4000);
        }
    });
}
