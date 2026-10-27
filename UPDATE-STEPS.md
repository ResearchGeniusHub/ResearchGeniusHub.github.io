# Update steps (about 10 minutes)
1. Supabase > SQL Editor: open supabase-setup.sql, CHECK the admin email near the top, paste, Run.
2. Deploy two functions (from this folder):
   supabase functions deploy rgh-sample --no-verify-jwt
   supabase functions deploy rgh-staff
   (rgh-sample uses the same secrets as rgh-notify: RESEND_API_KEY, FROM_EMAIL, ADMIN_EMAIL, SITE_URL)
3. Upload every file in this folder to GitHub (replace existing). New files: samples-app.js, supabase/.
4. Sign in as admin > Admin page > Staff tab: add staff (username + password of 10+ characters). Reset password button is on each staff card.
5. Admin page > Samples tab: upload PDFs. Sample access tab: confirm payments and the code is emailed.
