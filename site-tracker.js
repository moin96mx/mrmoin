document.addEventListener("DOMContentLoaded", async () => {
    const config = window.MR_MOIN_SUPABASE;
    if (!config || !window.supabase) return;

    const client = window.supabase.createClient(config.url, config.anonKey);
    const visitorKey = "mrmoin_visitor_id";
    let visitorId = localStorage.getItem(visitorKey);

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(visitorKey, visitorId);
    }

    const event = {
        visitor_id: visitorId,
        event_type: "page_view",
        page_path: window.location.pathname,
        page_title: document.title,
        referrer: document.referrer || null,
        metadata: {
            language: navigator.language || null,
            screen: `${window.innerWidth}x${window.innerHeight}`
        }
    };

    await client.from("site_events").insert(event);
});
