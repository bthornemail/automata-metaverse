# Fix GitHub Push Protection Error

## Problem

GitHub push protection detected secrets (npm access token) in commit `750c293`:
- `.env:1` - Contains npm token
- `.npmrc:1` - Contains npm token

## Solution

These files are already in `.gitignore`, but they were committed in the past. We need to remove them from git history.

## Option 1: Use the Script (Recommended)

```bash
cd /home/main/automaton/meta-log-db
chmod +x remove-secrets-from-history.sh
./remove-secrets-from-history.sh
git push origin --force --all
```

## Option 2: Manual Steps

### Step 1: Remove from current index
```bash
cd /home/main/automaton/meta-log-db
git rm --cached .env .npmrc
```

### Step 2: Remove from all commits
```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env .npmrc' \
  --prune-empty --tag-name-filter cat -- --all
```

### Step 3: Clean up
```bash
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Step 4: Force push
```bash
git push origin --force --all
```

## Option 3: Use BFG Repo-Cleaner (Faster)

If you have BFG installed:
```bash
cd /home/main/automaton/meta-log-db
bfg --delete-files .env .npmrc
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

## Option 4: Allow Secret (Not Recommended)

If you really need to keep the secret in history (NOT RECOMMENDED):
1. Visit: https://github.com/bthornemail/meta-log-db/security/secret-scanning/unblock-secret/35cYTRKeYyREOXGmZjuJMqOCqxg
2. Click "Allow secret"
3. Push again

**⚠️ WARNING**: This exposes your npm token publicly. Do NOT do this unless absolutely necessary.

## Verify Files Are Ignored

The `.gitignore` already includes:
```
.npmrc
.env
```

After removing from history, these files will remain on disk but won't be tracked by git.

## After Fixing

Once you've removed the secrets from history:
1. Verify: `git log --all --full-history -- .env .npmrc` should show nothing
2. Push: `git push origin --force --all`
3. Update remote tracking branch: `git fetch origin` (to sync local tracking refs)
4. Check GitHub: The push should succeed

## Update Remote Tracking Branch

After the force push, update your local remote tracking references:

```bash
git fetch origin
git branch -vv | grep automaton-intergration
```

This ensures `origin/automaton-intergration` points to the rewritten commit without secrets.

