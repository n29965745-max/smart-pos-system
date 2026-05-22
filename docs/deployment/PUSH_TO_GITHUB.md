# Push to GitHub (one-time setup)

Your security commit `35cbff4` is ready locally. GitHub does **not** accept your account password for `git push`.

## Fastest fix: Personal Access Token (about 2 minutes)

1. Open https://github.com/settings/tokens/new
2. Note: `smart-pos-push`
3. Expiration: 90 days (or your preference)
4. Scopes: check **repo** only
5. Click **Generate token** and copy it (shown once)

Then in terminal:

```bash
cd ~/Desktop
git remote set-url origin https://github.com/brunowachira001-coder/smart-pos-system.git
git push -u origin main
```

When prompted:

- **Username:** `brunowachira001-coder`
- **Password:** paste the **token** (not your GitHub login password)

To avoid typing it every time:

```bash
git config --global credential.helper store
git push -u origin main
# enter username + token once; git saves them in ~/.git-credentials
```

---

## Alternative: SSH (no token prompts after setup)

### Step 1 — Add this key to GitHub

Public key (already generated on this machine):

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEUBTb/cD3XWSGcz4rDU8BmrRhyxGYuj2ec59KApidaV johnsmarttraders220@gmail.com
```

1. https://github.com/settings/keys
2. **New SSH key** → Title: `Kali Bruno` → paste the line above → **Add SSH key**

### Step 2 — Push

```bash
cd ~/Desktop
git remote set-url origin git@github.com:brunowachira001-coder/smart-pos-system.git
git push -u origin main
```

---

## Optional: GitHub CLI

```bash
# Kali (as root or with sudo):
apt update && apt install gh

# Or use the binary in ~/.local/bin if installed:
export PATH="$HOME/.local/bin:$PATH"
gh auth login
cd ~/Desktop && git push -u origin main
```

---

## Verify

After a successful push:

```bash
git status
# should show: main...origin/main (no "ahead 1")
```

View on GitHub: https://github.com/brunowachira001-coder/smart-pos-system/commit/35cbff4
