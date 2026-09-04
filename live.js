document.addEventListener("DOMContentLoaded", async () => {
    // ============================================================
    // MR MOIN LIVE ROOM — Supabase Backend
    // ============================================================
    // IMPORTANT:
    // 1) Put your Supabase Project URL and PUBLIC anon key here.
    // 2) NEVER put the Supabase service_role key here.
    // 3) The admin password is NOT stored in this JavaScript.
    //    Create the admin user in Supabase Authentication instead.
    //
    // SUPABASE SETUP:
    // const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
    // const SUPABASE_ANON_KEY = "YOUR_PUBLIC_ANON_KEY";
    // ============================================================

    const SUPABASE_URL = "YOUR_SUPABASE_URL";
    const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

    const hasSupabaseConfig =
        !SUPABASE_URL.includes("YOUR_") &&
        !SUPABASE_ANON_KEY.includes("YOUR_");

    const supabaseClient = hasSupabaseConfig
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
        : null;

    let api = null;
    let currentRoom = "MrMoin_Live_Conference_Room_2026";
    let isAdmin = false;
    let presenceChannel = null;
    let chatChannel = null;
    let visitorId = localStorage.getItem("mrmoin_live_visitor_id");

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("mrmoin_live_visitor_id", visitorId);
    }

    const $ = (id) => document.getElementById(id);

    // ------------------------------------------------------------
    // JITSI
    // ------------------------------------------------------------
    function initJitsi(admin = false) {
        if (typeof JitsiMeetExternalAPI === "undefined") {
            console.error("Jitsi External API was not loaded.");
            return;
        }

        const container = $("jitsi-container");
        if (!container) return;

        container.innerHTML = "";

        const domain = "meet.jit.si";
        const options = {
            roomName: currentRoom,
            width: "100%",
            height: "100%",
            parentNode: container,
            userInfo: {
                displayName: admin ? "Mr. Moin (Admin)" : getGuestName()
            },
            configOverwrite: {
                prejoinPageEnabled: true,
                disableDeepLinking: true,
                startWithAudioMuted: false,
                startWithVideoMuted: false
            },
            interfaceConfigOverwrite: {
                TOOLBAR_BUTTONS: admin
                    ? [
                        "microphone", "camera", "chat", "raisehand",
                        "tileview", "fullscreen", "hangup",
                        "desktop", "mute-everyone", "security",
                        "recording", "settings", "select-background",
                        "videoquality", "filmstrip"
                    ]
                    : [
                        "microphone", "camera", "chat", "raisehand",
                        "tileview", "fullscreen", "hangup"
                    ]
            }
        };

        api = new JitsiMeetExternalAPI(domain, options);

        api.addEventListener("videoConferenceJoined", () => {
            broadcastPresence();
        });

        api.addEventListener("videoConferenceLeft", () => {
            broadcastPresence();
        });
    }

    function getGuestName() {
        return localStorage.getItem("mrmoin_live_name") || "Guest";
    }

    // ------------------------------------------------------------
    // SECURE ADMIN AUTH
    // ------------------------------------------------------------
    async function adminLogin() {
        if (!supabaseClient) {
            alert(
                "Supabase is not configured yet. Open README-SETUP.md and add your Supabase URL + public anon key."
            );
            return;
        }

        const email = prompt("Admin email:");
        if (!email) return;

        // The password is entered into Supabase Auth and is never hardcoded
        // into this frontend source code.
        const password = prompt("Admin password:");
        if (!password) return;

        const { error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            alert("Admin login failed: " + error.message);
            return;
        }

        const { data: profile, error: profileError } = await supabaseClient
            .from("live_admins")
            .select("user_id, display_name")
            .eq("user_id", (await supabaseClient.auth.getUser()).data.user.id)
            .maybeSingle();

        if (profileError || !profile) {
            await supabaseClient.auth.signOut();
            alert("This account is not authorized as a live-room admin.");
            return;
        }

        isAdmin = true;
        initJitsi(true);

        const panel = $("adminPanel");
        if (panel) panel.style.display = "block";

        const btn = $("adminBtn");
        if (btn) btn.textContent = "Admin Active";

        alert("Admin login successful.");
    }

    async function adminLogout() {
        if (supabaseClient) await supabaseClient.auth.signOut();
        isAdmin = false;

        const panel = $("adminPanel");
        if (panel) panel.style.display = "none";

        const btn = $("adminBtn");
        if (btn) btn.textContent = "Host / Admin Access";

        initJitsi(false);
    }

    // ------------------------------------------------------------
    // PRESENCE — realtime online users
    // ------------------------------------------------------------
    async function setupPresence() {
        if (!supabaseClient) return;

        presenceChannel = supabaseClient.channel("mrmoin-live-presence", {
            config: {
                presence: {
                    key: visitorId
                }
            }
        });

        presenceChannel
            .on("presence", { event: "sync" }, () => {
                const state = presenceChannel.presenceState();
                const count = Object.keys(state).length;

                const onlineEl =
                    $("onlineUsers") ||
                    $("onlineCount") ||
                    $("liveUsersCount");

                if (onlineEl) onlineEl.textContent = count;
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    await presenceChannel.track({
                        id: visitorId,
                        name: getGuestName(),
                        role: isAdmin ? "admin" : "guest",
                        joined_at: new Date().toISOString()
                    });
                }
            });
    }

    async function broadcastPresence() {
        if (!presenceChannel) return;
        await presenceChannel.track({
            id: visitorId,
            name: getGuestName(),
            role: isAdmin ? "admin" : "guest",
            updated_at: new Date().toISOString()
        });
    }

    // ------------------------------------------------------------
    // Q&A — persistent database + realtime
    // ------------------------------------------------------------
    async function loadQuestions() {
        if (!supabaseClient || !$("questionsList")) return;

        const { data, error } = await supabaseClient
            .from("live_questions")
            .select("id, name, question, created_at")
            .eq("status", "approved")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Question load error:", error);
            return;
        }

        const list = $("questionsList");
        list.innerHTML = "";

        data.forEach(renderQuestion);
    }

    function renderQuestion(q) {
        const list = $("questionsList");
        if (!list) return;

        const card = document.createElement("div");
        card.className = "q-card";

        const name = document.createElement("strong");
        name.textContent = q.name || "Guest";

        const question = document.createElement("p");
        question.textContent = q.question || "";

        card.appendChild(name);
        card.appendChild(question);
        list.prepend(card);
    }

    function setupQuestionRealtime() {
        if (!supabaseClient) return;

        supabaseClient
            .channel("mrmoin-live-questions")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "live_questions",
                    filter: "status=eq.approved"
                },
                (payload) => renderQuestion(payload.new)
            )
            .subscribe();
    }

    // ------------------------------------------------------------
    // OPTIONAL CUSTOM CHAT — Supabase Realtime Broadcast
    // ------------------------------------------------------------
    function setupChatBroadcast() {
        if (!supabaseClient) return;

        chatChannel = supabaseClient.channel("mrmoin-live-chat");
        chatChannel.subscribe();
    }

    // ------------------------------------------------------------
    // FORM EVENTS
    // ------------------------------------------------------------
    const qaForm = $("qaForm");
    if (qaForm) {
        qaForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = ($("qaName")?.value || "").trim();
            const email = ($("qaEmail")?.value || "").trim();
            const question = ($("qaQuestion")?.value || "").trim();

            if (!name || !question) {
                alert("Please enter your name and question.");
                return;
            }

            if (!supabaseClient) {
                alert("Supabase is not configured yet.");
                return;
            }

            const { error } = await supabaseClient
                .from("live_questions")
                .insert({
                    name,
                    email: email || null,
                    question,
                    status: "approved"
                });

            if (error) {
                alert("Could not submit your question: " + error.message);
                return;
            }

            qaForm.reset();
            alert("Your question was submitted.");
        });
    }

    const adminBtn = $("adminBtn");
    if (adminBtn) {
        adminBtn.addEventListener("click", () => {
            if (isAdmin) {
                adminLogout();
            } else {
                adminLogin();
            }
        });
    }

    // Existing admin controls
    const changeRoomBtn = $("changeRoom");
    if (changeRoomBtn) {
        changeRoomBtn.addEventListener("click", () => {
            if (!isAdmin) {
                alert("Admin access required.");
                return;
            }

            const newRoom = prompt("Enter new Jitsi room name:", currentRoom);
            if (!newRoom) return;

            currentRoom = newRoom.trim().replace(/\s+/g, "_");

            if (api) api.dispose();
            initJitsi(true);
        });
    }

    const toggleMuteBtn = $("toggleMute");
    if (toggleMuteBtn) {
        toggleMuteBtn.addEventListener("click", () => {
            if (!api) return;
            api.executeCommand("toggleAudio");
        });
    }

    const resetBtn = $("resetStream");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (!isAdmin) {
                alert("Admin access required.");
                return;
            }

            if (api) api.dispose();
            initJitsi(true);
        });
    }

    // ------------------------------------------------------------
    // START
    // ------------------------------------------------------------
    initJitsi(false);

    if (supabaseClient) {
        await setupPresence();
        await loadQuestions();
        setupQuestionRealtime();
        setupChatBroadcast();
    } else {
        console.warn(
            "Supabase not configured. Jitsi still works, but realtime backend features are disabled."
        );
    }
});

const SUPABASE_URL = "https://rvzgezwckqdloodqkwwo.supabase.co";

const SUPABASE_ANON_KEY = "sb_publishable_SdMVHuvRH36yJCh78L04Fg_hWsDFh3u";
