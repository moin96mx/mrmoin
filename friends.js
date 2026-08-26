document.addEventListener("DOMContentLoaded", () => {
    const friendCards = document.querySelectorAll(".friend-card");
    const searchInput = document.getElementById("searchFriend");
    const filterBtns = document.querySelectorAll(".filter-btn");

    // SEARCH FUNCTIONALITY
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase().trim();

            friendCards.forEach(card => {
                const name = card.querySelector("h3").innerText.toLowerCase();
                const role = card.querySelector(".role-tag").innerText.toLowerCase();

                if (name.includes(query) || role.includes(query)) {
                    card.style.display = "block";
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

            friendCards.forEach(card => {
                const category = card.getAttribute("data-category");

                if (filterValue === "all" || category === filterValue) {
                    card.style.display = "block";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    // MODAL POPUP LOGIC FOR FRIEND DETAILS
    const modal = document.getElementById("friendModal");
    const closeModal = document.querySelector(".close-modal");

    document.querySelectorAll(".view-profile-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const card = btn.closest(".friend-card");

            const name = card.querySelector("h3").innerText;
            const role = card.querySelector(".role-tag").innerText;
            const bio = card.querySelector(".friend-bio").innerText;
            const imgSrc = card.querySelector("img").src;

            if (modal) {
                modal.querySelector(".modal-name").innerText = name;
                modal.querySelector(".modal-role").innerText = role;
                modal.querySelector(".modal-bio").innerText = bio;
                modal.querySelector(".modal-img").src = imgSrc;

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