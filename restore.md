# Restore Checkpoint

- Date: 2025-08-21 12:46:15 EEST
- Commit: fa6201c
- Branch/Tag: checkpoint-YYYYMMDD-HHMMSS (created at save time)

## Summary
Stable snapshot after rebuilding backend and polishing booking UX:
- DB-backed APIs restored (/api/bookings, /api/availability, admin routes)
- Overlap checks fixed; midnight wrap (00:00–02:00) handled
- Booking page cleaned with confirmation + Save booking (PDF)
- PDF branding added (centered logo, header/footer bars)
- Time grid split into Today and After-midnight sections
- Admin page connected (list, edit, delete, export)

## How to Restore
- List tags/branches: `git tag` and `git branch -a`
- Checkout the checkpoint branch: `git checkout checkpoint-YYYYMMDD-HHMMSS`
- Or reset hard to commit: `git reset --hard fa6201c`
