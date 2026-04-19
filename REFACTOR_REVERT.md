# Prototype split (HTML / CSS / JS)

`bereal_profile.html` was refactored from a single ~970 KB file into:

| File | Role |
|------|------|
| `bereal_profile.html` | Shell markup + `preload` for CSS |
| `bereal_profile.css` | All styles and embedded subset fonts |
| `bereal_profile.js` | All behaviour (`defer`, end of `<body>`) |

## Why

- **Maintainability:** edit logic or layout in smaller files.
- **Optional faster repeat visits:** browser can cache `.css` / `.js` separately (first load still requests three assets; `preload` hints CSS).

## Revert (restore monolith)

Git keeps the previous single-file version on the tag **`pre-split-monolith`** (commit right before the split landed).

### Option A — one command (recommended)

From repo root, after pulling:

```bash
git checkout pre-split-monolith -- bereal_profile.html
git rm -f bereal_profile.css bereal_profile.js REFACTOR_REVERT.md
git commit -m "Revert prototype split; restore monolithic HTML"
```

### Option B — revert the split commit

```bash
git log --oneline -5   # find the split commit SHA
git revert --no-edit <SHA>
```

### Option C — read-only copy without committing

```bash
git show pre-split-monolith:bereal_profile.html > bereal_profile.monolith.html
```

## Smoke tests after any change

1. Switch all five prototype tabs (including Non-public).
2. Open / close BeReal detail from Friend; switch profile while open.
3. Public BeReals: segment buttons + two-finger pinch on the grid.
4. Highlights: new highlight flow, selection, Create button states.

There is no automated test suite in this repo; add one if the prototype grows further.
