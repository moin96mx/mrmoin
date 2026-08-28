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
                const category = card.querySelector(".blog-category-tag").innerText.toLowerCase();

                if (title.includes(query) || excerpt.includes(query) || category.includes(query)) {
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

    // READ MORE MODAL LOGIC FOR CARDS
    const modal = document.getElementById("blogModal");
    const closeModal = document.querySelector(".close-modal");

    document.querySelectorAll(".read-more-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const card = btn.closest(".blog-card");

            const title = card.querySelector("h3").innerText;
            const excerpt = card.querySelector(".blog-excerpt").innerText;
            const category = card.querySelector(".blog-category-tag").innerText;
            const date = card.querySelector(".blog-meta span").innerText;
            const imgSrc = card.querySelector(".blog-thumb img") ? card.querySelector(".blog-thumb img").src : "";

            openBlogModal(title, excerpt, category, date, imgSrc);
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

    // MOBILE MENU TOGGLE
    const mobileToggle = document.getElementById("mobileToggle");
    const navLinks = document.getElementById("navLinks");

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener("click", () => {
            navLinks.classList.toggle("active");
        });
    }
});

// GLOBAL OPEN MODAL FUNCTION
function openBlogModal(title, content, category, date, imgSrc = "") {
    const modal = document.getElementById("blogModal");
    if (!modal) return;

    const modalTitle = modal.querySelector(".modal-blog-title");
    const modalBody = modal.querySelector(".modal-blog-body");
    const modalImg = modal.querySelector(".modal-blog-img");
    const modalCat = document.getElementById("modalCategory");
    const modalDate = document.getElementById("modalDate");

    if (modalTitle) modalTitle.innerText = title;
    if (modalBody) modalBody.innerText = content;
    if (modalCat) modalCat.innerText = category;
    if (modalDate) modalDate.innerText = date;

    if (modalImg) {
        if (imgSrc) {
            modalImg.src = imgSrc;
            modalImg.style.display = "block";
        } else {
            modalImg.style.display = "none";
        }
    }

    modal.classList.add("active");
}
