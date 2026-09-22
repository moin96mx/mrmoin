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

    const loginPanel = document.getElementById('loginPanel');
    const dashboardPanel = document.getElementById('dashboardPanel');
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');
    const projectList = document.getElementById('projectList');
    const questionList = document.getElementById('questionList');
    const eventList = document.getElementById('eventList');
    const enrollmentList = document.getElementById('enrollmentList');

    // Which record types support archive/restore (vs. delete-only), and what
    // their "archived" and "restore" status values are.
    const TABLE_MAP = {
        project: { table: 'project_inquiries', hasStatus: true, archiveValue: 'archived', restoreValue: 'new' },
        question: { table: 'live_questions', hasStatus: true, archiveValue: 'archived', restoreValue: 'approved' },
        event: { table: 'site_events', hasStatus: false },
        enrollment: { table: 'course_enrollments', hasStatus: true, archiveValue: 'archived', restoreValue: 'new' }
    };

    // Tracks whether each panel is currently showing archived records.
    const showArchived = { project: false, question: false, enrollment: false };

    const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[character]));

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
            element.innerHTML = '<p class="muted">Nothing here yet.</p>';
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

    async function loadDashboard() {
        let projectQuery = client.from('project_inquiries').select('*').order('created_at', { ascending: false });
        if (!showArchived.project) projectQuery = projectQuery.neq('status', 'archived');

        let questionQuery = client.from('live_questions').select('id,name,email,question,status,created_at').order('created_at', { ascending: false });
        if (!showArchived.question) questionQuery = questionQuery.neq('status', 'archived');

        let enrollmentQuery = client.from('course_enrollments').select('*').order('created_at', { ascending: false });
        if (!showArchived.enrollment) enrollmentQuery = enrollmentQuery.neq('status', 'archived');

        const [{ data: projects, error: projectError }, { data: questions, error: questionError }, { data: events, error: eventError }, { data: enrollments, error: enrollmentError }] = await Promise.all([
            projectQuery,
            questionQuery,
            client.from('site_events').select('id,visitor_id,event_type,page_path,page_title,referrer,created_at').order('created_at', { ascending: false }).limit(50),
            enrollmentQuery
        ]);

        if (projectError) projectList.innerHTML = `<p class="status">Project table unavailable. Run supabase-schema.sql first.</p>`;
        else showRecordList(projectList, projects, 'project');

        if (questionError) questionList.innerHTML = `<p class="status">Could not load live questions.</p>`;
        else showRecordList(questionList, questions, 'question');

        if (eventError) eventList.innerHTML = `<p class="status">Run the updated schema to enable activity tracking.</p>`;
        else showRecordList(eventList, events, 'event');

        if (enrollmentError) enrollmentList.innerHTML = `<p class="status">Run the updated schema to enable course enrolments.</p>`;
        else showRecordList(enrollmentList, enrollments, 'enrollment');
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
            await loadDashboard();
        } catch (error) {
            alert('Something went wrong: ' + error.message);
            button.disabled = false;
        }
    }

    [projectList, questionList, enrollmentList, eventList].forEach(list => {
        list.addEventListener('click', handleRecordAction);
    });

    function wireArchiveToggle(buttonId, key) {
        const button = document.getElementById(buttonId);
        if (!button) return;
        button.addEventListener('click', async () => {
            showArchived[key] = !showArchived[key];
            button.textContent = showArchived[key] ? 'Hide archived' : 'Show archived';
            await loadDashboard();
        });
    }
    wireArchiveToggle('toggleArchivedProjects', 'project');
    wireArchiveToggle('toggleArchivedQuestions', 'question');
    wireArchiveToggle('toggleArchivedEnrollments', 'enrollment');

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
    document.getElementById('refreshProjects').addEventListener('click', loadDashboard);
    document.getElementById('refreshQuestions').addEventListener('click', loadDashboard);
    document.getElementById('refreshEvents').addEventListener('click', loadDashboard);
    document.getElementById('refreshEnrollments').addEventListener('click', loadDashboard);

    client.auth.getSession().then(({ data }) => setAuthenticated(data.session?.user || null));
});
