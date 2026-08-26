document.addEventListener("DOMContentLoaded", () => {
    const courseCards = document.querySelectorAll(".course-card");
    const searchInput = document.getElementById("searchCourse");
    const filterBtns = document.querySelectorAll(".c-filter-btn");

    // SEARCH FUNCTIONALITY
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();

            courseCards.forEach(card => {
                const title = card.querySelector("h3").innerText.toLowerCase();
                const desc = card.querySelector(".course-details").innerText.toLowerCase();

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

            courseCards.forEach(card => {
                const category = card.getAttribute("data-category");

                if (filterValue === "all" || category === filterValue) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // ENROLLMENT MODAL LOGIC
    const modal = document.getElementById("courseModal");
    const closeModal = document.querySelector(".close-modal");

    document.querySelectorAll(".enroll-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const card = btn.closest(".course-card");

            const title = card.querySelector("h3").innerText;
            const price = card.querySelector(".course-price").innerText;

            if (modal) {
                modal.querySelector(".modal-course-title").innerText = title;
                modal.querySelector(".modal-course-price").innerText = price;
                modal.classList.add("active");
            }
        });
    });

    if (closeModal) {
        closeModal.addEventListener("click", () => {
            modal.classList.remove("active");
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("active");
        }
    });

    // COPY AFFILIATE LINK
    const affBtn = document.getElementById("copyAffiliateBtn");
    if (affBtn) {
        affBtn.addEventListener("click", () => {
            const affiliateLink = window.location.origin + "/courses.html?ref=moin_affiliate";
            navigator.clipboard.writeText(affiliateLink);
            alert("আপনার অ্যাফিলিয়েট রেফারেল লিংক কপি হয়েছে: " + affiliateLink);
        });
    }
});