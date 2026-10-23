# Security Specification: FinanZas Quincenal

## 1. Data Invariants
1. **User Data Isolation (Strict Multi-tenancy)**: A user can only view, create, edit, or delete data (incomes, expenses, categories, savings, goals) located under their own `/users/{userId}/...` path where `request.auth.uid == userId`.
2. **Immutable Identity**: All documents created within a user's tree must have `userId == request.auth.uid`. In updates, `userId` is strictly immutable.
3. **Valid Data Types & Boundaries**:
   - Amounts must be positive numbers (`amount > 0` or `amount >= 0` for goals).
   - Text fields must not exceed specified length boundaries.
   - Quincena ID must match valid quincenal format (`^[0-9]{4}-[0-9]{2}-Q[1-2]$`).
4. **No Cross-User Access**: Unauthenticated users or users attempting to read or write to another user's path are denied immediately.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Payload 1 (Ghost Field Injection)**: Injecting unauthorized arbitrary fields like `{ isAdmin: true }` into an income or expense document.
2. **Payload 2 (Cross-User Write)**: Attempting to write into `/users/victim_user_123/expenses/exp_1` while authenticated as `attacker_user_456`.
3. **Payload 3 (Cross-User List Scrape)**: Querying `/users/victim_user_123/expenses` as another user.
4. **Payload 4 (Identity Spoofing)**: Submitting `{ userId: "other_user_id" }` in the document payload.
5. **Payload 5 (Negative / Zero Amount)**: Submitting `{ amount: -500 }` or `{ amount: 0 }` for an expense.
6. **Payload 6 (String Amount Injection)**: Submitting `{ amount: "1500" }` as a string instead of number.
7. **Payload 7 (Denial of Wallet 1MB String Attack)**: Submitting a 1MB junk string in `description` or `establishment`.
8. **Payload 8 (Invalid ID Injection)**: Attempting to create a document with an ID containing malicious symbols or path traversal like `../../admins`.
9. **Payload 9 (Unauthenticated Read)**: Calling `get()` or `list()` without authentication (`request.auth == null`).
10. **Payload 10 (Identity Mutation Attack)**: Updating an existing expense to change its `userId` from `auth.uid` to another user.
11. **Payload 11 (Malicious Status Shortcutting)**: Injecting system-level flags into Category or UserProfile.
12. **Payload 12 (Invalid Quincena Format)**: Submitting `{ quincenaId: "2026-INVALID-Q9" }`.

## 3. Test Runner Invariant Assertions
All 12 payloads must be rejected with `PERMISSION_DENIED` by the hardened Firestore rules.
