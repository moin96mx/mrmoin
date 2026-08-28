document.addEventListener("DOMContentLoaded", () => {
    let api = null;

    // 1. INITIALIZE JITSI MEET
    const initJitsi = (isAdmin = false) => {
        const domain = 'meet.jit.si';
        const container = document.querySelector('#jitsi-container');
        container.innerHTML = ''; // Clear container

        const options = {
            roomName: 'MrMoin_Live_Conference_Room_2026',
            width: '100%',
            height: '100%',
            parentNode: container,
            userInfo: {
                displayName: isAdmin ? 'MR MOIN (Host)' : 'Guest User'
            },
            configOverwrite: {
                prejoinPageEnabled: false,
                disableDeepLinking: true,
                enableWelcomePage: false,
                // Admin settings
                startWithAudioMuted: !isAdmin,
                disableRemoteMute: !isAdmin // Only admin can remote mute
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                MOBILE_APP_PROMO: false,
                // Toolbar options based on admin mode
                TOOLBAR_BUTTONS: isAdmin ? [
                    'microphone', 'camera', 'desktop', 'embedmeeting', 'fullscreen',
                    'fodeviceselection', 'hangup', 'chat', 'recording',
                    'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                    'videoquality', 'filmstrip', 'participants-pane', 'tileview', 'mute-everyone', 'security'
                ] : [
                    'microphone', 'camera', 'fullscreen', 'hangup', 'raisehand', 'tileview'
                ]
            }
        };
        api = new JitsiMeetExternalAPI(domain, options);
    };

    initJitsi(false); // Start as normal user

    // 2. ADMIN ACCESS TOGGLE
    const adminModeBtn = document.getElementById("adminModeBtn");
    adminModeBtn.addEventListener("click", () => {
        const password = prompt("Enter Admin Password:");
        if (password === "2004131") { // Admin Password
            alert("Admin Access Granted! Loading Host Controls...");
            initJitsi(true);
            adminModeBtn.style.background = "#00ff88";
            adminModeBtn.style.color = "#000";
            adminModeBtn.innerHTML = `<i class="fa-solid fa-user-check"></i> Admin Active`;
        } else if (password !== null) {
            alert("Wrong Password!");
        }
    });

    // 3. SIDE CHAT FUNCTIONALITY
    const chatMessages = document.getElementById("chatMessages");
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");

    function addMessage(user, text) {
        if (!text.trim()) return;
        const msgDiv = document.createElement("div");
        msgDiv.classList.add("chat-item");
        msgDiv.innerHTML = `<span class="chat-user">${user}:</span><span>${text}</span>`;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (sendBtn && chatInput) {
        sendBtn.addEventListener("click", () => {
            addMessage("You", chatInput.value);
            chatInput.value = "";
        });
        chatInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                addMessage("You", chatInput.value);
                chatInput.value = "";
            }
        });
    }

    // 4. Q&A / SUPPORT FORM FUNCTIONALITY
    const qaForm = document.getElementById("qaForm");
    const questionsList = document.getElementById("questionsList");

    qaForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("qaName").value;
        const question = document.getElementById("qaQuestion").value;

        if (questionsList.children[0] && questionsList.children[0].tagName === "P") {
            questionsList.innerHTML = ""; // Remove "No questions" text
        }

        const qCard = document.createElement("div");
        qCard.classList.add("q-card");
        qCard.innerHTML = `<strong>${name}</strong><p>${question}</p>`;

        questionsList.prepend(qCard); // Add new question at top
        qaForm.reset();
        alert("Question Submitted Successfully!");
    });
});
