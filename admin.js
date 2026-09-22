document.addEventListener('DOMContentLoaded', () => {
    const loginStatus = document.getElementById('loginStatus');
    const config = window.MR_MOIN_SUPABASE;
    if (!config || !window.supabase) {
        loginStatus.textContent = 'Supabase configuration did not load. Refresh the page.';
        return;
    }

    let client;
    try {
        client = window.supabase.createClient(config.url, config.anonKey);
    } catch (error) {
        loginStatus.textContent = 'Supabase configuration is invalid.';
        return;
    }

    const PAGE_SIZE = 20;

    const loginPanel = document.getElementById('loginPanel');
    const dashboardPanel = document.getElementById('dashboardPanel');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const listEls = {
        project: document.getElementById('projectList'),
        question: document.getElementById('questionList'),
        event: document.getElementById('eventList'),
        enrollment: document.getElementById('enrollmentList')
    };
    const loadMoreButtons = {
        project: document.getElementById('loadMoreProjects'),
        question: document.getElementById('loadMoreQuestions'),
        event: document.getElementById('loadMoreEvents'),
        enrollment: document.getElementById('loadMoreEnrollments')
    };

    // Which record types support archive/restore (vs. delete-only), the
    // Supabase table each maps to, and which columns go into a CSV export.
    const TABLE_MAP = {
        project: {
            table: 'project_inquiries', hasStatus: true, archiveValue: 'archived', restoreValue: 'new',
            select: '*', csvFields: ['id', 'name', 'email', 'phone', 'service', 'status', 'message', 'created_at']
        },
        question: {
            table: 'live_questions', hasStatus: true, archiveValue: 'archived', restoreValue: 'approved',
            select: 'id,name,email,question,status,created_at', csvFields: ['id', 'name', 'email', 'question', 'status', 'created_at']
        },
        event: {
            table: 'site_events', hasStatus: false,
            select: 'id,visitor_id,event_type,page_path,page_title,referrer,created_at', csvFields: ['id', 'visitor_id', 'event_type', 'page_path', 'page_title', 'referrer', 'created_at']
        },
        enrollment: {
            table: 'course_enrollments', hasStatus: true, archiveValue: 'archived', restoreValue: 'new',
            select: '*', csvFields: ['id', 'name', 'email', 'phone', 'course', 'status', 'created_at']
        }
    };

    // Tracks whether each panel is currently showing archived records.
    const showArchived = { project: false, question: false, enrollment: false };

    // Holds every record fetched so far for each panel (across all loaded
    // pages), so search filtering can run instantly without a network call.
    const cachedRecords = { project: [], question: [], event: [], enrollment: [] };

    // Pagination cursor + whether another page might exist, per panel.
    const pageState = {
        project: { offset: 0, hasMore: true },
        question: { offset: 0, hasMore: true },
        event: { offset: 0, hasMore: true },
        enrollment: { offset: 0, hasMore: true }
    };

    const searchInputs = {
        project: document.getElementById('searchProjects'),
        question: document.getElementById('searchQuestions'),
        event: document.getElementById('searchEvents'),
        enrollment: document.getElementById('searchEnrollments')
    };
    const statusFilters = {
        project: document.getElementById('filterStatusProjects'),
        question: document.getElementById('filterStatusQuestions'),
        enrollment: document.getElementById('filterStatusEnrollments')
    };

    const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));

    // Which fields of a record are searched, per type. Search only runs
    // against records already loaded into this panel (use Load more first
    // if what you're looking for might be further back).
    function searchableText(type, record) {
        const fieldsByType = {
            project: ['name', 'email', 'phone', 'service', 'message'],
            question: ['name', 'email', 'question'],
            event: ['event_type', 'page_path', 'page_title', 'referrer', 'visitor_id'],
            enrollment: ['name', 'email', 'phone', 'course']
        };
        return fieldsByType[type]
            .map(field => record[field] || '')
            .join(' ')
            .toLowerCase();
    }

    function applyFilters(type, records) {
        const searchTerm = (searchInputs[type]?.value || '').trim().toLowerCase();
        return records.filter(record => {
            if (searchTerm && !searchableText(type, record).includes(searchTerm)) return false;
            return true;
        });
    }

    function actionsHtml(type, record) {
        const map = TABLE_MAP[type];
        const buttons = [];
        if (map.hasStatus) {
            if (record.status === map.archiveValue) {
                buttons.push(`<button class="button small secondary" data-action="unarchive" data-type="${type}" data-id="${record.id}">Restore</button>`);
            } else {
                buttons.push(`<button class="button small secondary" data-action="archive" data-type="${type}" data-id="${record.id}">Archive</button>`);
            }
        }
        buttons.push(`<button class="button small danger" data-action="delete" data-type="${type}" data-id="${record.id}">Delete</button>`);
        return `<div class="record-actions">${buttons.join('')}</div>`;
    }

    function showRecordList(element, records, type) {
        if (!records?.length) {
            element.innerHTML = '<p class="muted">Nothing matches your search/filter.</p>';
            return;
        }

        element.innerHTML = records.map(record => {
                const title = type === 'project'
                    ? `${escapeHtml(record.name)} · ${escapeHtml(record.service || 'General enquiry')}`
                    : type === 'event'
                        ? `${escapeHtml(record.event_type)} · ${escapeHtml(record.page_path)}`
                        : type === 'enrollment'
                            ? `${escapeHtml(record.name)} · ${escapeHtml(record.course)}`
                        : escapeHtml(record.name || 'Guest');
            const detail = type === 'project'
                ? `${escapeHtml(record.email)}${record.phone ? ` · ${escapeHtml(record.phone)}` : ''}`
                    : type === 'event'
                        ? `${escapeHtml(record.page_title || 'Untitled page')} · ${escapeHtml(new Date(record.created_at).toLocaleString())}`
                        : type === 'enrollment'
                            ? `${escapeHtml(record.email)} · ${escapeHtml(record.phone)}`
                        : escapeHtml(record.email || 'No email provided');
                const body = type === 'project' ? record.message : type === 'event' ? `Visitor: ${record.visitor_id}` : type === 'enrollment' ? `Status: ${record.status}` : record.question;
                const status = type === 'project' ? `<small>Status: ${escapeHtml(record.status)}</small>` : type === 'event' ? `<small>Referrer: ${escapeHtml(record.referrer || 'Direct visit')}</small>` : type === 'enrollment' ? `<small>Course request</small>` : `<small>${record.status === 'archived' ? 'Archived question' : 'Approved live question'}</small>`;
            return `<article class="record" data-record-id="${record.id}"><div class="record-top"><div><strong>${title}</strong><small>${detail}</small></div>${status}</div><p>${escapeHtml(body)}</p>${actionsHtml(type, record)}</article>`;
        }).join('');
    }

    function renderPanel(type) {
        showRecordList(listEls[type], applyFilters(type, cachedRecords[type]), type);
        if (loadMoreButtons[type]) loadMoreButtons[type].hidden = !pageState[type].hasMore;
    }

    function renderAllPanels() {
        Object.keys(listEls).forEach(renderPanel);
    }

    function buildQuery(type) {
        const map = TABLE_MAP[type];
        let query = client.from(map.table).select(map.select).order('created_at', { ascending: false });
        if (map.hasStatus) {
            if (!showArchived[type]) query = query.neq('status', 'archived');
            const statusValue = statusFilters[type]?.value;
            if (statusValue && statusValue !== 'all') query = query.eq('status', statusValue);
        }
        return query;
    }

    async function fetchPage(type, { reset = false } = {}) {
        if (reset) {
            pageState[type].offset = 0;
            pageState[type].hasMore = true;
            cachedRecords[type] = [];
        }
        if (!pageState[type].hasMore) return;

        const offset = pageState[type].offset;
        const { data, error } = await buildQuery(type).range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            listEls[type].innerHTML = `<p class="status">Could not load data: ${escapeHtml(error.message)}</p>`;
            return;
        }

        cachedRecords[type] = cachedRecords[type].concat(data || []);
        pageState[type].offset = offset + (data?.length || 0);
        pageState[type].hasMore = (data?.length || 0) === PAGE_SIZE;
        renderPanel(type);
    }

    async function loadDashboard() {
        await Promise.all(Object.keys(listEls).map(type => fetchPage(type, { reset: true })));
    }

    async function handleRecordAction(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        const { action, type, id } = button.dataset;
        const map = TABLE_MAP[type];
        if (!map || !id) return;

        button.disabled = true;
        try {
            if (action === 'delete') {
                if (!confirm('Delete this entry permanently? This cannot be undone.')) { button.disabled = false; return; }
                const { error } = await client.from(map.table).delete().eq('id', id);
                if (error) { alert('Delete failed: ' + error.message); button.disabled = false; return; }
            } else if (action === 'archive') {
                const { error } = await client.from(map.table).update({ status: map.archiveValue }).eq('id', id);
                if (error) { alert('Archive failed: ' + error.message); button.disabled = false; return; }
            } else if (action === 'unarchive') {
                const { error } = await client.from(map.table).update({ status: map.restoreValue }).eq('id', id);
                if (error) { alert('Restore failed: ' + error.message); button.disabled = false; return; }
            }
            await fetchPage(type, { reset: true });
        } catch (error) {
            alert('Something went wrong: ' + error.message);
            button.disabled = false;
        }
    }

    Object.values(listEls).forEach(list => list.addEventListener('click', handleRecordAction));

    // Search boxes filter the already-cached data instantly (no network call).
    Object.entries(searchInputs).forEach(([type, input]) => {
        if (!input) return;
        input.addEventListener('input', () => renderPanel(type));
    });

    // Status dropdowns are applied server-side (combined with pagination),
    // so changing one re-fetches from the first page.
    Object.entries(statusFilters).forEach(([type, select]) => {
        if (!select) return;
        select.addEventListener('change', () => fetchPage(type, { reset: true }));
    });

    function wireArchiveToggle(buttonId, key) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        button.addEventListener('click', async () => {
            showArchived[key] = !showArchived[key];
            button.textContent = showArchived[key] ? 'Hide archived' : 'Show archived';
            await fetchPage(key, { reset: true });
        });
    }
    wireArchiveToggle('toggleArchivedProjects', 'project');
    wireArchiveToggle('toggleArchivedQuestions', 'question');
    wireArchiveToggle('toggleArchivedEnrollments', 'enrollment');

    Object.entries(loadMoreButtons).forEach(([type, button]) => {
        if (!button) return;
        button.addEventListener('click', async () => {
            button.disabled = true;
            await fetchPage(type, { reset: false });
            button.disabled = false;
        });
    });

    function csvEscape(value) {
        const text = value === null || value === undefined ? '' : String(value);
        if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
        return text;
    }

    function exportCsv(type) {
        const map = TABLE_MAP[type];
        const records = applyFilters(type, cachedRecords[type]);
        if (!records.length) { alert('Nothing loaded to export yet — adjust filters or load more records first.'); return; }

        const rows = [map.csvFields.join(',')];
        records.forEach(record => {
            rows.push(map.csvFields.map(field => csvEscape(record[field])).join(','));
        });

        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${map.table}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    document.getElementById('exportProjects')?.addEventListener('click', () => exportCsv('project'));
    document.getElementById('exportQuestions')?.addEventListener('click', () => exportCsv('question'));
    document.getElementById('exportEvents')?.addEventListener('click', () => exportCsv('event'));
    document.getElementById('exportEnrollments')?.addEventListener('click', () => exportCsv('enrollment'));

    async function setAuthenticated(user) {
        if (!user) {
            loginPanel.hidden = false;
            dashboardPanel.hidden = true;
            logoutBtn.hidden = true;
            return;
        }

        const { data: admins, error } = await client.from('live_admins').select('user_id');
        const isAdmin = admins?.some(admin => admin.user_id === user.id);
        if (error || !isAdmin) {
            await client.auth.signOut();
            loginStatus.textContent = error
                ? `Admin table error: ${error.message}`
                : `This account is not listed in live_admins. User ID: ${user.id}`;
            return;
        }

        loginPanel.hidden = true;
        dashboardPanel.hidden = false;
        logoutBtn.hidden = false;
        await loadDashboard();
    }

    loginForm.addEventListener('submit', async event => {
        event.preventDefault();
        loginStatus.textContent = 'Signing in...';
        const { data, error } = await client.auth.signInWithPassword({
            email: document.getElementById('adminEmail').value.trim(),
            password: document.getElementById('adminPassword').value
        });
        if (error) {
            loginStatus.textContent = error.message;
            return;
        }
        loginStatus.textContent = '';
        await setAuthenticated(data.user);
    });

    logoutBtn.addEventListener('click', async () => {
        await client.auth.signOut();
        await setAuthenticated(null);
    });
    document.getElementById('refreshProjects').addEventListener('click', () => fetchPage('project', { reset: true }));
    document.getElementById('refreshQuestions').addEventListener('click', () => fetchPage('question', { reset: true }));
    document.getElementById('refreshEvents').addEventListener('click', () => fetchPage('event', { reset: true }));
    document.getElementById('refreshEnrollments').addEventListener('click', () => fetchPage('enrollment', { reset: true }));

    client.auth.getSession().then(({ data }) => setAuthenticated(data.session?.user || null));
});
