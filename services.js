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

    // ORDER / BOOKING MODAL LOGIC
    const modal = document.getElementById("serviceModal");
    const closeModal = document.querySelector(".close-modal");

    document.querySelectorAll(".order-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const card = btn.closest(".service-card");

            const title = card.querySelector("h3").innerText;
            const price = card.querySelector(".service-price").innerText;

            if (modal) {
                const modalTitle = modal.querySelector(".modal-service-title");
                const modalPrice = modal.querySelector(".modal-service-price");

                if (modalTitle) modalTitle.innerText = title;
                if (modalPrice) modalPrice.innerText = price;

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
});