document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chatMessages");
    const chatInput = document.getElementById("chatInput");
    const sendBtn = document.getElementById("sendBtn");

    // FUNCTION TO ADD NEW CHAT MESSAGE
    function addMessage(user, text) {
        if (!text.trim()) return;

        const msgDiv = document.createElement("div");
        msgDiv.classList.add("chat-item");
        msgDiv.innerHTML = `<span class="chat-user">${user}:</span><span>${text}</span>`;
        
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Auto scroll to bottom
    }

    // SEND MESSAGE EVENT
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

    // SIMULATE AUTOMATIC DUMMY LIVE CHATS
    const botUsers = ["Alex", "Rahim", "Dev_Moin", "CyberBoy", "Sara"];
    const botMessages = [
        "Hello everyone!",
        "আজকের লাইভ স্ট্রিমটা দারুণ হচ্ছে!",
        "অপেক্ষা করছিলাম আজকের টপিকের জন্য।",
        "Next class কখন হবে?",
        "Fire content! 🔥"
    ];

    setInterval(() => {
        const randomUser = botUsers[Math.floor(Math.random() * botUsers.length)];
        const randomMsg = botMessages[Math.floor(Math.random() * botMessages.length)];
        if (chatMessages) {
            addMessage(randomUser, randomMsg);
        }
    }, 7000); // 7 সেকেন্ড পর পর চ্যাট সিমুলেট করবে
});
