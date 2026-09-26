# Fix admin balance and transaction actions

## Changes
- Correct the protected debit operation so verified server-side admin actions can debit accounts, while browser/customer access remains blocked.
- Preserve existing insufficient-funds checks and all current balance/history modes.
- Apply the database correction to both the preview backend and the independent production backend.
- Reverse the one-cent diagnostic credit in both databases.
- Surface useful server errors for future failures instead of replacing them with a generic message.

## Verification
- Test credit and debit with an immediately reversed amount.
- Test Adjust balance and Create transaction through the admin request flow.
- Confirm balances and available funds remain consistent, then check the app build.
