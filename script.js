// // ================= MOBILE MENU =================

// const menuBtn = document.querySelector(".menu-btn");
// const navLinks = document.querySelector(".nav-links");

// menuBtn.addEventListener("click", () => {
//     navLinks.classList.toggle("active");
// });


// // ================= CLOSE MENU =================

// document.querySelectorAll(".nav-links a").forEach(link => {

//     link.addEventListener("click", () => {
//         navLinks.classList.remove("active");
//     });

// });


// // ================= SKILL PROGRESS =================

// const progressCircles = document.querySelectorAll(".progress-circle");

// progressCircles.forEach(circle => {

//     const percent = circle.dataset.percent;

//     const degree = percent * 3.6;

//     circle.style.background = `
//         conic-gradient(
//             #8b3dff 0deg,
//             #00b7ff ${degree}deg,
//             #182033 ${degree}deg
//         )
//     `;

// });


// // ================= COUNTER ANIMATION =================

// const counters = document.querySelectorAll(".counter");

// let started = false;


// function startCounter() {

//     if (started) return;

//     const terminal =
//         document.querySelector(".terminal-section");

//     const position =
//         terminal.getBoundingClientRect().top;

//     const screenPosition =
//         window.innerHeight;


//     if (position < screenPosition) {

//         counters.forEach(counter => {

//             const target =
//                 +counter.dataset.target;

//             let count = 0;

//             const speed =
//                 Math.ceil(target / 50);


//             const updateCounter = () => {

//                 if (count < target) {

//                     count += speed;

//                     if (count > target) {
//                         count = target;
//                     }

//                     counter.innerText = count + "+";

//                     setTimeout(
//                         updateCounter,
//                         40
//                     );

//                 }

//             };

//             updateCounter();

//         });


//         started = true;

//     }

// }


// window.addEventListener(
//     "scroll",
//     startCounter
// );


// // ================= CONTACT FORM =================

// const form =
//     document.querySelector(".contact-form");


// form.addEventListener("submit", function (event) {

//     event.preventDefault();

//     alert(
//         "Message system is ready! এখন এটাকে backend-এর সাথে connect করতে হবে."
//     );

// });
