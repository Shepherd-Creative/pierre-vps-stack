# Website Templates

This folder contains templates and scripts for setting up the `personal-website` submodule securely.

## Contents

| File | Purpose | How to Use |
|------|---------|------------|
| `pre-commit-hook.sh` | Git hook to prevent committing secrets | Copy to `personal-website/.git/hooks/pre-commit` |
| `env.example` | Template for environment variables | Copy to `personal-website/.env.example` |
| `gitignore-additions` | Additional .gitignore entries | Merge with `personal-website/.gitignore` |

## Setup Instructions

After cloning/adding the `personal-website` submodule:

```bash
# 1. Navigate to pierre-vps-dev root
cd ~/Documents/pierre-vps-dev

# 2. Install pre-commit hook
cp website-templates/pre-commit-hook.sh personal-website/.git/hooks/pre-commit
chmod +x personal-website/.git/hooks/pre-commit

# 3. Set up environment file template
cp website-templates/env.example personal-website/.env.example

# 4. Create your local .env (never committed)
cp personal-website/.env.example personal-website/.env
# Then edit .env with your real values

# 5. Verify .gitignore includes .env entries
cat personal-website/.gitignore | grep ".env"
# If missing, add entries from gitignore-additions
```

## Testing the Pre-commit Hook

```bash
cd personal-website

# Create a test file with a fake secret
echo 'const key = "sk-1234567890abcdef1234567890abcdef";' > test-secret.js
git add test-secret.js
git commit -m "test"

# Expected: Hook blocks commit with error message

# Clean up
rm test-secret.js
git reset HEAD test-secret.js
```
