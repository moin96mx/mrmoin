document.addEventListener("DOMContentLoaded", () => {
    const blogCards = document.querySelectorAll(".blog-card");
    const searchInput = document.getElementById("searchBlog");
    const filterBtns = document.querySelectorAll(".b-filter-btn");

    // SEARCH FUNCTIONALITY
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();

            blogCards.forEach(card => {
                const title = card.querySelector("h3").innerText.toLowerCase();
                const excerpt = card.querySelector(".blog-excerpt").innerText.toLowerCase();

                if (title.includes(query) || excerpt.includes(query)) {
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

            blogCards.forEach(card => {
                const category = card.getAttribute("data-category");

                if (filterValue === "all" || category === filterValue) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // READ MORE MODAL LOGIC
    const modal = document.getElementById("blogModal");
    const closeModal = document.querySelector(".close-modal");

    document.querySelectorAll(".read-more-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const card = btn.closest(".blog-card");

            const title = card.querySelector("h3").innerText;
            const excerpt = card.querySelector(".blog-excerpt").innerText;
            const imgSrc = card.querySelector(".blog-thumb img") ? card.querySelector(".blog-thumb img").src : "";

            if (modal) {
                const modalTitle = modal.querySelector(".modal-blog-title");
                const modalBody = modal.querySelector(".modal-blog-body");
                const modalImg = modal.querySelector(".modal-blog-img");

                if (modalTitle) modalTitle.innerText = title;
                if (modalBody) modalBody.innerText = excerpt;
                if (modalImg && imgSrc) modalImg.src = imgSrc;

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