
const menuBtn = document.querySelector(".menu-btn");
const navLinks = document.querySelector(".nav-links");

if (menuBtn && navLinks) {
    const updateMenuState = () => {
        const isOpen = navLinks.classList.contains("active");
        menuBtn.setAttribute("aria-expanded", String(isOpen));
        menuBtn.setAttribute("aria-label", isOpen ? "Close Menu" : "Toggle Menu");
    };

    menuBtn.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        updateMenuState();
    });

    updateMenuState();
}

document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        if (navLinks) {
            navLinks.classList.remove("active");
        }
        if (menuBtn) {
            menuBtn.setAttribute("aria-expanded", "false");
            menuBtn.setAttribute("aria-label", "Toggle Menu");
        }
    });
});

const progressCircles = document.querySelectorAll(".progress-circle");

progressCircles.forEach(circle => {
    const percent = circle.dataset.percent;
    const degree = percent * 3.6;

    circle.style.background = `
        conic-gradient(
            #8b3dff 0deg,
            #00b7ff ${degree}deg,
            #182033 ${degree}deg
        )
    `;
});

const counters = document.querySelectorAll(".counter");
let started = false;

function startCounter() {
    if (started) return;

    const terminal = document.querySelector(".terminal-section");
    if (!terminal) return;

    const position = terminal.getBoundingClientRect().top;
    const screenPosition = window.innerHeight;

    if (position < screenPosition) {
        counters.forEach(counter => {
            const target = +counter.dataset.target;
            let count = 0;
            const speed = Math.ceil(target / 50);

            const updateCounter = () => {
                if (count < target) {
                    count += speed;
                    if (count > target) count = target;
                    counter.innerText = count + "+";
                    setTimeout(updateCounter, 40);
                }
            };
            updateCounter();
        });
        started = true;
    }
}

window.addEventListener("scroll", startCounter);

const form = document.querySelector(".contact-form");

if (form) {
    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const data = new FormData(event.target);
        const nameInput = form.querySelector("[name='name']");
        const userName = nameInput ? nameInput.value.trim() : "User";
        const supabaseClient = window.supabase?.createClient(
            window.MR_MOIN_SUPABASE?.url,
            window.MR_MOIN_SUPABASE?.anonKey
        );

        try {
            if (supabaseClient) {
                const { error } = await supabaseClient.from("project_inquiries").insert({
                    name: userName,
                    email: data.get("email"),
                    subject: data.get("subject"),
                    message: data.get("message")
                });

                if (!error) {
                    alert(`Thanks ${userName}! আপনার মেসেজটি সফলভাবে জমা হয়েছে।`);
                    form.reset();
                    return;
                }
            }

            const response = await fetch("https://formspree.io/f/xyegrbro", {
                method: "POST",
                body: data,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                alert(`Thanks ${userName}! আপনার মেসেজটি সফলভাবে পৌঁছেছে। Mr. Moin খুব শীঘ্রই আপনার সাথে যোগাযোগ করবেন।`);
                form.reset();
            } else {
                alert("দুঃখিত, মেসেজ পাঠানো সম্ভব হয়নি। আবার চেষ্টা করুন।");
            }
        } catch (error) {
            alert("নেটওয়ার্ক সমস্যা! আপনার ইন্টারনেট কানেকশনটি চেক করুন।");
        }
    });
}
