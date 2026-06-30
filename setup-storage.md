# Storage setup (file uploads & avatars)

The SQL editor cannot modify `storage.objects` (owner permission error). Set up storage in the **Supabase Dashboard** instead.

## 1. Create buckets

**Storage → New bucket**

| Name               | Public bucket |
|--------------------|---------------|
| `internship-files` | Yes           |
| `avatars`          | Yes           |

## 2. Add policies per bucket

For **each** bucket (`internship-files` and `avatars`):

**Storage → [bucket name] → Policies → New policy**

### Policy 1 — Upload (INSERT)

- **Policy name:** `Authenticated users can upload`
- **Allowed operation:** INSERT
- **Target roles:** `authenticated`
- **Policy definition:**

```sql
(bucket_id = 'internship-files')
```

(Use `avatars` when setting up the avatars bucket.)

### Policy 2 — Read (SELECT)

- **Allowed operation:** SELECT
- **Target roles:** `authenticated`
- **Policy definition:**

```sql
(bucket_id = 'internship-files')
```

### Policy 3 — Delete (DELETE)

- **Allowed operation:** DELETE
- **Target roles:** `authenticated`
- **Policy definition:**

```sql
(bucket_id = 'internship-files')
```

---

**Note:** If buckets are **public**, file downloads work without extra read policies. Upload/delete policies are still required for signed-in users.

**Optional:** Skip storage entirely — the tracker works without file uploads; only resume/attachment features need buckets.
