# Pre-Commit Hooks

This project uses [Husky](https://typicode.github.io/husky/) to run checks before each commit, preventing broken code from being pushed to Railway.

## What Gets Checked

Before you can commit, the pre-commit hook automatically runs:

1. **TypeScript Type Checking** (`npm run type-check`)
   - Validates all TypeScript types
   - Catches type errors before they reach Railway
   - Uses `tsc --noEmit` (checks types without building)

2. **ESLint** (`npm run lint`)
   - Checks code style and catches common errors
   - Enforces coding standards
   - Prevents linting issues from reaching production

## How It Works

When you run `git commit`, Husky automatically:
1. Runs TypeScript type checking
2. Runs ESLint
3. **Blocks the commit** if any checks fail
4. **Allows the commit** only if all checks pass

## What Happens If Checks Fail?

If the pre-commit hook finds errors:

```
❌ TypeScript type check failed. Please fix the errors above.
```

or

```
❌ Linting failed. Please fix the errors above.
```

The commit will be **blocked** and you'll need to:
1. Fix the errors shown in the output
2. Try committing again

## Bypassing the Hook (Not Recommended)

If you absolutely need to bypass the hook (e.g., for a WIP commit), use:

```bash
git commit --no-verify
```

**Warning:** Only use this if you're sure the code will work. Railway will still run the build, and it will fail if there are errors.

## Manual Testing

You can manually run the same checks that the hook runs:

```bash
# Check TypeScript types
npm run type-check

# Run linter
npm run lint

# Run both (what the hook does)
npm run type-check && npm run lint
```

## Installation

Husky is automatically set up when you run `npm install` (via the `prepare` script in `package.json`).

If you clone the repo fresh, just run:

```bash
npm install
```

This will automatically set up the git hooks.

## Files

- `.husky/pre-commit` - The pre-commit hook script
- `package.json` - Contains the `type-check` and `lint` scripts
- `package.json` - Contains the `prepare` script that sets up Husky

## Benefits

✅ **Catch errors early** - Find TypeScript and linting errors before pushing  
✅ **Prevent broken builds** - Railway won't receive code with build errors  
✅ **Consistent code quality** - All commits must pass the same checks  
✅ **Faster feedback** - Get errors immediately, not after Railway build fails  

