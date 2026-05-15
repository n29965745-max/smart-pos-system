# Security rotation checklist

These steps were prepared after removing exposed credentials from the repo and git remote. **You must rotate secrets that were ever stored in docs, shell history, or git history** — redacting files does not invalidate old keys.

## Already fixed in this repo

- [x] Git `origin` URL no longer embeds a GitHub personal access token
- [x] Tracked documentation and scripts redacted (see `scripts/redact-secrets.py`)
- [x] `VERCEL_ENV_VARS_ESSENTIAL_ONLY.md` uses placeholders only
- [x] Root `.env.example` added for safe sharing

## You must do manually (in order)

### 1. GitHub (urgent)

1. Open https://github.com/settings/tokens
2. **Revoke** any token that was stored in `git remote` or shell history
3. Create a new fine-grained or classic token with minimum scope (`repo` only if needed)
4. Authenticate with SSH or `gh auth login` — do not put tokens in remote URLs

### 2. Supabase

1. Project → **Settings** → **API** → reset **service_role** key (and anon if concerned)
2. **Settings** → **Database** → reset database password
3. Update `.env.local` and **Vercel** environment variables
4. Redeploy Vercel

### 3. JWT and app secrets

Regenerate and update everywhere (local + Vercel):

- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`
- `CRON_SECRET`

Existing login sessions will be invalidated.

### 4. Redis (Upstash)

1. Rotate password in Upstash dashboard
2. Update `REDIS_URL` in Vercel and `.env.local`

### 5. SMS providers

Rotate keys for any provider you use:

- Celcom: `CELCOM_API_KEY`
- Africa's Talking: `AFRICASTALKING_API_KEY`
- Mobitech / SMS Leopard if configured

### 6. Shell history

If you used `git push` with a token in the URL, clear matching lines from `~/.zsh_history` or run:

```bash
sed -i '/ghp_/d' ~/.zsh_history && fc -R
```

### 7. Git history (optional, if repo is public)

Redacting current files does **not** remove secrets from old commits. If the repo is or was public:

- Use [GitHub secret scanning](https://docs.github.com/en/code-security/secret-scanning) alerts
- Consider `git filter-repo` or BFG Repo-Cleaner, then force-push (coordinate with collaborators)

## Prevent recurrence

- Never commit `.env.local` (already in `.gitignore`)
- Never paste real keys into markdown
- Use `git remote set-url origin git@github.com:brunowachira001-coder/smart-pos-system.git` for SSH
- Run `python3 scripts/redact-secrets.py` before large doc commits if pasting env snippets
