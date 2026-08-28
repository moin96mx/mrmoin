document.addEventListener("DOMContentLoaded", () => {
    let api = null;
    let currentRoom = 'MrMoin_Live_Conference_Room_2026';

    const initJitsi = (isAdmin = false, roomName = currentRoom) => {
        const domain = 'meet.jit.si';
        const container = document.querySelector('#jitsi-container');
        container.innerHTML = '';

        const options = {
            roomName: roomName,
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
                startWithAudioMuted: false,
                disableRemoteMute: !isAdmin
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                MOBILE_APP_PROMO: false,
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'chat', 'raisehand', 'tileview', 'fullscreen', 'hangup',
                    ...(isAdmin ? [
                        'desktop', 
                        'mute-everyone', 
                        'security', 
                        'recording', 
                        'settings', 
                        'select-background', 
                        'fodeviceselection'
                    ] : [])
                ]
            }
        };
        api = new JitsiMeetExternalAPI(domain, options);
    };

    initJitsi(false);

    // ADMIN TOGGLE & SETTINGS PANEL
    const adminModeBtn = document.getElementById("adminModeBtn");
    const adminSettingsPanel = document.getElementById("adminSettingsPanel");
    const changeRoomBtn = document.getElementById("changeRoomBtn");
    const customRoomInput = document.getElementById("customRoomInput");
    const toggleAudioBtn = document.getElementById("toggleAudioBtn");
    const reloadMeetingBtn = document.getElementById("reloadMeetingBtn");

    if (adminModeBtn) {
        adminModeBtn.addEventListener("click", () => {
            const password = prompt("Enter Admin Password:");
            if (password === "moin123") {
                initJitsi(true);
                adminModeBtn.style.background = "#00ff88";
                adminModeBtn.style.color = "#000";
                adminModeBtn.innerHTML = `<i class="fa-solid fa-user-check"></i> Admin Active`;
                
                // Show Settings Panel
                if (adminSettingsPanel) {
                    adminSettingsPanel.style.display = "grid";
                }
            }
        });
    }

    // ADMIN SETTINGS ACTIONS
    if (changeRoomBtn && customRoomInput) {
        changeRoomBtn.addEventListener("click", () => {
            const newRoom = customRoomInput.value.trim();
            if (newRoom) {
                currentRoom = newRoom.replace(/\s+/g, '_');
                initJitsi(true, currentRoom);
                customRoomInput.value = "";
            }
        });
    }

    if (toggleAudioBtn) {
        toggleAudioBtn.addEventListener("click", () => {
            if (api) {
                api.executeCommand('toggleAudio');
            }
        });
    }

    if (reloadMeetingBtn) {
        reloadMeetingBtn.addEventListener("click", () => {
            if (api) {
                initJitsi(true, currentRoom);
            }
        });
    }

    // Q&A FORM
    const qaForm = document.getElementById("qaForm");
    const questionsList = document.getElementById("questionsList");

    if (qaForm) {
        qaForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const name = document.getElementById("qaName").value;
            const email = document.getElementById("qaEmail").value.trim();
            const question = document.getElementById("qaQuestion").value;

            if (questionsList.children[0] && questionsList.children[0].tagName === "P") {
                questionsList.innerHTML = "";
            }

            const qCard = document.createElement("div");
            qCard.classList.add("q-card");
            
            const emailText = email ? ` <span style="color: var(--text); font-weight: normal; font-size: 11px;">(${email})</span>` : '';
            qCard.innerHTML = `<strong>${name}${emailText}</strong><p>${question}</p>`;

            questionsList.prepend(qCard);
            qaForm.reset();
        });
    }
});
