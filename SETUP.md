# MR MOIN Production Setup

## 1. Configure Supabase

1. Open the Supabase project used by the website.
2. Open **Project Settings > API** and copy the Project URL and publishable key into `supabase-config.js`.
3. Open **SQL Editor**.
4. Paste and run the complete contents of `supabase-schema.sql`.
5. Open **Authentication > Users** and create the admin account.
6. Copy the new user's UUID.
7. Run this query in SQL Editor:

```sql
insert into public.live_admins (user_id, display_name)
values ('PASTE_ADMIN_USER_UUID_HERE', 'MR MOIN Admin')
on conflict (user_id) do nothing;
```

## 2. Test the dashboard

Open `/admin.html`, sign in with the Supabase admin account, and confirm that project enquiries, live questions, course enrolments, and recent page activity load.

## 3. Production checklist

- Replace placeholder project, team, GitHub, LinkedIn and social URLs.
- Confirm the contact email, WhatsApp number and business address.
- Test contact and service forms on a deployed HTTPS domain.
- Configure the custom domain and DNS records.
- Keep the Supabase publishable key in frontend code; never expose a service-role key.
- Verify Row Level Security is enabled before launch.
- Tell visitors in your privacy notice that anonymous page activity is recorded for site improvement.

## 4. Local preview

```text
http://127.0.0.1:8000/index.html
http://127.0.0.1:8000/services.html
http://127.0.0.1:8000/admin.html
```
