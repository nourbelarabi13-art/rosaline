# Security Specification - Rosaline Bela Platform

## 1. Data Invariants

- **Users**:
  - Every user document MUST have a `userId` matching their authenticated Firebase Auth UID.
  - The `email` and `displayName` cannot be empty.
  - A user cannot modify another user's profile metadata.

- **Novels**:
  - A novel cannot be created without a valid `authorId` that exactly matches `request.auth.uid`.
  - A user cannot create or edit a novel and list someone else as the `authorId` (Identity Spoofing guard).
  - Only the authenticated author can `update` or `delete` their novels.
  - Custom fields cannot be randomly injected; strict schema keys check will enforce this.

## 2. The "Dirty Dozen" Poison Payloads

Here are 12 specific payloads attempting to violate security invariants and verify they are rejected by security rules:

1. **Spoofed User Registration**: Attempting to create a user profile with a different `userId` than the authenticated session.
2. **Ghost-Field Injection on Profile**: Writing a user profile with administrative flags (e.g., `isAdmin: true`).
3. **Empty Name Registration**: Writing a user profile with an empty string or abnormally long display name.
4. **Spoofed Authorship Creation**: Creating a novel with user A's credentials but putting user B's UID in `authorId`.
5. **No-Name Novel Publishing**: Publishing a novel with empty `title` or `content` field.
6. **Denial of Wallet Novel ID**: Accessing or creating a novel with a 5KB junk string document identifier.
7. **Privileged Rating Tampering**: An update payload that increments the `rating` directly (which should only be handled via reviews logic).
8. **Immutability Breach on Novel**: Attempting to change `authorId` or `createdAt` on an existing novel.
9. **Massive Overwrite Attack**: Saving a chapter contents exceeding 100,000 characters.
10. **Orphaned Novel Post**: Creating a novel whose `createdAt` timestamp is set to a client-side hardcoded date instead of `request.time`.
11. **Impersonated Deletion**: Attempting to delete a novel authored by another user.
12. **Blind Scraping Attack**: Executing an unrestricted collection query targeting personal emails without a userId clause.

## 3. Test Invariant Outlining

Under the Firestore rules:
- `get(/databases/$(database)/documents/users/$(request.auth.uid))` ensures real accounts exist.
- `isValidId(id)` guards against character injection.
- Unrestricted write requests strictly return `PERMISSION_DENIED` under all circumstances.
