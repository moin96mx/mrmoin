document.addEventListener("DOMContentLoaded", () => {
    const serviceCards = document.querySelectorAll(".service-card");
    const searchInput = document.getElementById("searchService");
    // BUG FIX 1: Only filter buttons WITH data-filter. The "Custom Budget" button in HUD also has .s-filter-btn but no data-filter, clicking it hid all cards.
    const filterBtns = document.querySelectorAll(".s-filter-btn[data-filter]");
    let activeFilter = "all";

    function applyFilters() {
        const query = (searchInput?.value || "").toLowerCase().trim();
        serviceCards.forEach(card => {
            const title = card.querySelector("h3")?.innerText.toLowerCase() || "";
            const desc = card.querySelector(".service-desc")?.innerText.toLowerCase() || "";
            const category = card.getAttribute("data-category");
            const matchFilter = activeFilter === "all" || category === activeFilter;
            const matchSearch = !query || title.includes(query) || desc.includes(query);
            // BUG FIX 2: Search + Filter combined. Before, search ignored filter and filter ignored search.
            card.style.display = (matchFilter && matchSearch) ? "flex" : "none";
        });
    }

    if (searchInput) searchInput.addEventListener("input", applyFilters);

    filterBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeFilter = btn.getAttribute("data-filter");
            applyFilters();
        });
    });

    const mobileToggle = document.getElementById("mobileToggle");
    const navLinks = document.getElementById("navLinks");
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener("click", () => navLinks.classList.toggle("active"));
    }

    // Form submit is inside DOMContentLoaded now so elements are guaranteed to exist
    const cyberForm = document.getElementById('futuristicOrderForm');
    if (cyberForm) {
        cyberForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const btn = document.getElementById('cyberSubmitBtn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = 'TRANSMITTING DATA <i class="fa-solid fa-spinner fa-spin"></i>';
            btn.disabled = true;

            const formData = new FormData(cyberForm);

            // BUG FIX 3: Supabase client creation was OUTSIDE try/catch and with possibly undefined url/key.
            // createClient(undefined, undefined) throws "supabaseUrl is required" -> uncaught, Formspree fallback never ran.
            let supabaseClient = null;
            try {
                if (window.supabase && window.MR_MOIN_SUPABASE?.url && window.MR_MOIN_SUPABASE?.anonKey) {
                    supabaseClient = window.supabase.createClient(window.MR_MOIN_SUPABASE.url, window.MR_MOIN_SUPABASE.anonKey);
                }
            } catch (err) {
                console.warn('Supabase init failed, falling back to Formspree:', err);
                supabaseClient = null;
            }

            try {
                if (supabaseClient) {
                    const { error } = await supabaseClient.from('project_inquiries').insert({
                        name: formData.get('client_name'),
                        email: formData.get('client_email'),
                        phone: formData.get('client_phone'),
                        service: formData.get('selected_service'),
                        message: formData.get('project_details') || 'No additional project details provided.'
                    });
                    if (!error) {
                        btn.innerHTML = 'PROJECT BRIEF RECEIVED <i class="fa-solid fa-circle-check"></i>';
                        // BUG FIX 4 (MAIN BUG): alert('...') used single-quotes with real line breaks -> SyntaxError, whole services.js failed to parse, so NO function worked.
                        // Fixed with template literal / \n
                        alert(`Website Request Submitted Successfully!\nআপনার selected website-এর request সফলভাবে গ্রহণ করা হয়েছে। আপনার প্রয়োজন ও পছন্দ অনুযায়ী design, features ও functionality customize করা যাবে.\n\nMR MOIN Team আপনার request review করে শীঘ্রই আপনার সাথে যোগাযোগ করবে।`);
                        cyberForm.reset();
                        updateLivePreview();
                        return;
                    }
                }

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
                console.error(err);
                alert('⚠️ [NETWORK ERROR] ইন্টারনেট সংযোগ চেক করুন।');
            } finally {
                btn.disabled = false;
                setTimeout(() => { btn.innerHTML = originalHTML; }, 4000);
            }
        });
    }
});

function openCyberTerminal(serviceTitle, servicePrice, deliveryTime) {
    const selectedInput = document.getElementById('selected_service');
    const prevPkg = document.getElementById('prevPkg');
    const prevPrice = document.getElementById('prevPrice');
    const prevTime = document.getElementById('prevTime');
    if (selectedInput) selectedInput.value = serviceTitle;
    if (prevPkg) prevPkg.innerText = serviceTitle;
    if (prevPrice) prevPrice.innerText = servicePrice;
    if (prevTime) prevTime.innerText = deliveryTime;
    document.getElementById('order-terminal')?.scrollIntoView({ behavior: 'smooth' });
}

function updateLivePreview() {
    // BUG FIX 5: Direct .value access without null-check crashed if any field missing. Added ?. guards.
    const name = document.getElementById('client_name')?.value || '';
    const email = document.getElementById('client_email')?.value || '';
    const phone = document.getElementById('client_phone')?.value || '';
    const prevName = document.getElementById('prevName'); if (prevName) prevName.innerText = name.trim() !== '' ? name : '---';
    const prevEmail = document.getElementById('prevEmail'); if (prevEmail) prevEmail.innerText = email.trim() !== '' ? email : '---';
    const prevPhone = document.getElementById('prevPhone'); if (prevPhone) prevPhone.innerText = phone.trim() !== '' ? phone : '---';
    const hudStatus = document.getElementById('hudStatus');
    if (hudStatus) { hudStatus.innerText = 'DATA INPUT DETECTED'; hudStatus.style.color = '#00f0ff'; }
}
