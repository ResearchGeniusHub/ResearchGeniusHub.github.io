# Update steps: website reorganisation (about 2 minutes)

This update changes the website only. There is NO SQL change and NO Edge Function change.

New menu order: Home, Research Support, Data Services, Editing, Coaching, Help, Samples, Sign in.

New pages: research-support.html, data-services.html, editing.html, help.html.
Homepage: About, Services, Price list, Testimonials.
Coaching page: coaching services list added above the booking section.
Samples page: quick buttons for Essays, Reports, Business plans, Presentations, Proposals, Concept papers, Dissertations.

1. GitHub: upload EVERY file from this folder (replace existing). Do not delete the old files; some are used by the admin and sample pages.
2. Wait for the green tick under Actions (1 to 2 minutes).
3. Open https://researchgeniushub.github.io and check the menu, then one page from each group.

Already needed from earlier setup (no change now): supabase-setup.sql run once in Supabase; the super-worker Edge Function deployed with Verify JWT OFF (code in super-worker-FUNCTION.ts).
