# End Product Confirmation Checklist

## 1. User accounts and authentication
- [ ] A user can sign up with email and password
- [ ] A user can log in
- [ ] A user can log out
- [ ] A user can request a password reset
- [ ] A user can complete a password reset with a valid token
- [ ] Email verification works
- [ ] Unverified users are handled correctly
- [ ] Active sessions are visible
- [ ] Old sessions can be revoked
- [ ] Device history is visible if included
- [ ] Login alerts work if included
- [ ] Google or Microsoft login works if included
- [ ] Magic link login works if included later
- [ ] MFA can be enabled
- [ ] MFA can be disabled safely
- [ ] MFA backup codes can be generated
- [ ] MFA backup codes can be used once only
- [ ] Security settings show correct current state
- [ ] Last login time is recorded
- [ ] Last login IP is recorded
- [ ] Locale can be stored per user

## 2. Roles, memberships, and permissions
- [ ] A company owner can invite members
- [ ] A member invitation can be accepted
- [ ] A pending invitation has a clear status
- [ ] Owner role works
- [ ] Staff or employee role works
- [ ] Accountant or bookkeeper role works
- [ ] Auditor role works if included
- [ ] Read only role works if included
- [ ] Payroll only role works if included
- [ ] Sales only role works if included
- [ ] Integration admin role works if included
- [ ] Permissions are enforced on API endpoints
- [ ] Permissions are enforced in the UI
- [ ] Users cannot access another company’s data
- [ ] Role changes take effect correctly
- [ ] Member status and last active data are accurate

## 3. Company profiles and settings
- [ ] A company can be created
- [ ] A user can switch between multiple companies
- [ ] Company name is stored correctly
- [ ] Address and contact details are stored correctly
- [ ] CVR lookup works if included
- [ ] VAT registration status can be set
- [ ] Fiscal year can be configured
- [ ] Currency can be configured
- [ ] Invoice settings can be configured
- [ ] Logo upload works
- [ ] Branding shows correctly on documents
- [ ] Association support works if included
- [ ] Branches or departments work if included
- [ ] Company settings load and save correctly
- [ ] Company level defaults are used in related workflows

## 4. Contacts
- [ ] A customer can be created
- [ ] A supplier can be created
- [ ] A contact can be edited
- [ ] A contact can be archived
- [ ] A contact can be restored if supported
- [ ] Contact import works if included
- [ ] Contact export works if included
- [ ] Contact search works
- [ ] Contact filtering works
- [ ] Contact detail page loads correctly
- [ ] Contact balances are shown correctly
- [ ] Contact activity history is shown correctly
- [ ] Contact data is available inside sales and expense flows

## 5. Products and services
- [ ] A product can be created
- [ ] A service can be created
- [ ] A product or service can be edited
- [ ] A product or service can be archived
- [ ] Product import works if included
- [ ] Product export works if included
- [ ] Unit price is stored correctly
- [ ] VAT code can be assigned
- [ ] Unit of measure can be assigned
- [ ] Revenue or cost account mapping can be assigned
- [ ] Product search works
- [ ] Product filters work
- [ ] Products can be selected inside sales documents
- [ ] Product defaults flow into line items correctly

## 6. Sales document foundation
- [ ] Sales documents support the intended document types
- [ ] Document numbering follows company rules
- [ ] Status values are correct and stable
- [ ] Draft state works
- [ ] Sent state works
- [ ] Viewed state works if tracked
- [ ] Approved state works if included
- [ ] Paid state works
- [ ] Overdue state works
- [ ] Cancelled or void behavior works if included
- [ ] Timeline events are recorded
- [ ] Source audit trail exists for every key action
- [ ] Attachments can be added to a sales document
- [ ] PDF generation works
- [ ] Print or download flow works
- [ ] Currency and totals display correctly

## 7. Quotes
- [ ] A quote can be created
- [ ] A quote can be edited before finalization
- [ ] A quote can be sent
- [ ] A quote PDF renders correctly
- [ ] Quote approval flow works if included
- [ ] Quote signing flow works if included
- [ ] Quote status updates correctly
- [ ] Quote totals are correct
- [ ] Quote validity date works if included
- [ ] Quote can be converted to an invoice
- [ ] Quote to invoice conversion preserves lines and totals
- [ ] Quote to invoice conversion preserves customer data
- [ ] Quote to invoice conversion is traceable in the timeline

## 8. Invoices
- [ ] An invoice can be created
- [ ] An invoice can be edited while in draft
- [ ] Invoice issue date works
- [ ] Due date works
- [ ] Payment terms work
- [ ] Customer details populate correctly
- [ ] Line items calculate correctly
- [ ] VAT calculates correctly
- [ ] Net, VAT, and gross totals are correct
- [ ] Invoice can be sent by the intended channels
- [ ] Viewed state works if tracked
- [ ] Outstanding balance is correct
- [ ] Partial payment works if included
- [ ] Full payment closes the invoice correctly
- [ ] Overdue logic works
- [ ] Invoice activity history is complete
- [ ] Invoice PDF matches stored totals
- [ ] Invoice creates the correct accounting effect

## 9. Credit notes, order confirmations, and delivery notes
- [ ] A credit note can be created
- [ ] A credit note can reference the original invoice
- [ ] Credit note totals are correct
- [ ] Credit note reverses commercial balance correctly
- [ ] Credit note reverses ledger impact correctly
- [ ] Order confirmation works if included
- [ ] Delivery note works if included
- [ ] Related document links are visible

## 10. Recurring billing
- [ ] A recurring schedule can be created
- [ ] A recurring schedule can be edited
- [ ] A recurring schedule can be paused
- [ ] A recurring schedule can be resumed
- [ ] A recurring schedule can be run manually
- [ ] Frequency settings work
- [ ] Interval settings work
- [ ] Start date works
- [ ] End date works
- [ ] Next run date is accurate
- [ ] Auto send works if enabled
- [ ] Generated document history is visible
- [ ] Failed runs are logged clearly
- [ ] Recurring invoices create the correct documents

## 11. Reminders, collections, and overdue follow up
- [ ] Overdue invoices are visible in a queue
- [ ] Reminder levels are tracked
- [ ] A reminder can be sent manually
- [ ] Automatic reminder sequences work if included
- [ ] Reminder fee rules work if included
- [ ] Reminder notes are stored
- [ ] Reminder history is visible on the invoice
- [ ] Debt collection handoff works if included
- [ ] Debt collection case status is visible
- [ ] Collections actions are traceable

## 12. Receipt inbox and file handling
- [ ] A receipt image can be uploaded
- [ ] A receipt PDF can be uploaded
- [ ] File upload validates correctly
- [ ] Uploaded files are linked to the right company
- [ ] Receipt preview works
- [ ] Receipt inbox list works
- [ ] Extraction status is visible
- [ ] Linked versus unlinked receipt state is visible
- [ ] A receipt can be attached to an expense
- [ ] A receipt can be attached to a manual posting if supported
- [ ] File access rules are enforced correctly

## 13. Receipt extraction and review
- [ ] OCR or extraction runs on uploaded receipts
- [ ] Extracted supplier name can be reviewed
- [ ] Extracted date can be reviewed
- [ ] Extracted amount can be reviewed
- [ ] Extracted VAT can be reviewed
- [ ] Extracted currency can be reviewed
- [ ] Extracted fields can be corrected
- [ ] Review state is saved
- [ ] Failed extraction is shown clearly
- [ ] Duplicate detection works if included

## 14. Expenses
- [ ] An expense can be created manually
- [ ] An expense can be created from a receipt
- [ ] Expense supplier can be selected
- [ ] Expense category or account can be selected
- [ ] Expense date works
- [ ] Expense amount works
- [ ] VAT handling works
- [ ] Notes can be added
- [ ] An attached proof document remains linked
- [ ] Split allocation works if included
- [ ] Expense draft and posted states work if included
- [ ] Expense posting shows ledger preview
- [ ] Expense posting creates the correct journal entry
- [ ] Expense history is visible

## 15. Chart of accounts
- [ ] A default chart of accounts exists
- [ ] Account numbers are stored correctly
- [ ] Account names are stored correctly
- [ ] Account type is stored correctly
- [ ] System accounts are protected where needed
- [ ] Active and inactive state works
- [ ] Opening balances work
- [ ] VAT box mapping works where relevant
- [ ] Account list shows balances correctly
- [ ] Account detail shows running balance correctly

## 16. Ledger and journal entries
- [ ] Manual journal entries can be created
- [ ] Manual journal entries can be reviewed before posting
- [ ] Every journal entry is balanced
- [ ] Debit and credit lines are stored correctly
- [ ] Entry date works
- [ ] Source type and source id are stored correctly
- [ ] Created by user is stored correctly
- [ ] Journal detail shows all lines
- [ ] Journal lines show linked contact if present
- [ ] Journal lines show linked bank transaction if present
- [ ] Journal lines show linked receipt if present
- [ ] Journal entries are immutable after posting if required
- [ ] Reversal entries work if included
- [ ] Audit trail exists for every financial change
- [ ] Source links are visible from journal detail

## 17. Fiscal periods and period locking
- [ ] Fiscal periods can be created
- [ ] Fiscal periods show correct start and end dates
- [ ] Fiscal period status is correct
- [ ] A period can be locked
- [ ] Locked at timestamp is stored
- [ ] Editing blocked records in a locked period is prevented
- [ ] Allowed exceptions follow policy
- [ ] Unlock flow works if supported
- [ ] Users see clear messages when a period is locked

## 18. Cashbook and manual posting
- [ ] Cashbook screen loads correctly
- [ ] Manual income entry works
- [ ] Manual expense entry works
- [ ] Templates for repeated postings work if included
- [ ] Batch posting works if included
- [ ] CSV import works if included
- [ ] Keyboard heavy workflow is fast enough
- [ ] Manual postings create correct journal entries

## 19. VAT setup and VAT returns
- [ ] VAT codes can be listed
- [ ] VAT codes can be created
- [ ] VAT codes can be edited
- [ ] Sales flows apply VAT correctly
- [ ] Expense flows apply VAT correctly
- [ ] VAT prepare flow works
- [ ] VAT return periods are correct
- [ ] VAT return lines show correct box totals
- [ ] Source transaction counts are correct
- [ ] VAT return detail page loads correctly
- [ ] VAT transaction drilldown works
- [ ] VAT export works if included
- [ ] VAT submission works if included
- [ ] Submission logs are stored
- [ ] Filing receipts or proof are stored
- [ ] VAT periods can be locked after filing where required

## 20. Reports and financial overview
- [ ] Profit and loss report is correct
- [ ] Balance sheet is correct
- [ ] Customer balances report is correct
- [ ] Supplier balances report is correct
- [ ] VAT overview report is correct
- [ ] Aging report is correct if included
- [ ] Report filters work
- [ ] Report periods work
- [ ] Report exports work
- [ ] Saved reports work if included
- [ ] Report totals reconcile to ledger data
- [ ] Drilldown from reports works where intended

## 21. Banking foundation
- [ ] A bank connection can be created
- [ ] Bank accounts are stored correctly
- [ ] Bank account to ledger account mapping works
- [ ] Sync status is visible
- [ ] Last sync time is visible
- [ ] Manual bank statement import works if included
- [ ] Duplicate bank transactions are prevented
- [ ] Imported bank transactions are stored cleanly

## 22. Reconciliation
- [ ] Bank transactions appear in the reconciliation view
- [ ] Suggested matches appear where expected
- [ ] Suggestion confidence is visible if included
- [ ] Match to invoice works
- [ ] Match to expense works
- [ ] Match to transfer works
- [ ] Manual match works
- [ ] Split match works
- [ ] Unmatch works
- [ ] Reconciliation status is accurate
- [ ] Reconciliation creates correct accounting impact
- [ ] High volume reconciliation remains usable

## 23. Automation, suggestions, and assistant tasks
- [ ] Automation rules can be created if included
- [ ] Automation rules can be edited if included
- [ ] Automation rules can be deleted if included
- [ ] Suggestions list loads correctly
- [ ] Suggestion acceptance works
- [ ] Suggestion rejection works
- [ ] Accepted suggestions create the correct action
- [ ] Rejected suggestions are tracked correctly
- [ ] Assistant task feed loads correctly
- [ ] Assistant tasks can be updated
- [ ] Assistant tasks can be completed
- [ ] Assistant tasks point to the right records
- [ ] Assistant counts on the dashboard are accurate

## 24. Payments and checkout
- [ ] Payment provider accounts can be connected
- [ ] Payment provider accounts can be listed
- [ ] Payment provider accounts can be removed
- [ ] A payment link can be created from an invoice
- [ ] Payment link amount is correct
- [ ] Payment link expiry works if used
- [ ] Payment transaction history is visible
- [ ] Payment status updates correctly
- [ ] Paid at timestamp is recorded
- [ ] Failure reason is visible when relevant
- [ ] Webhook ingestion works
- [ ] Webhook handling is idempotent
- [ ] Manual mark paid flow works
- [ ] Invoice state updates correctly after payment

## 25. Payroll, employees, and payslips
- [ ] An employee can be created
- [ ] An employee can be edited
- [ ] An employee can be ended or archived correctly
- [ ] Employee setup checklist works
- [ ] Compensation profile can be configured
- [ ] Pension profile can be configured
- [ ] Benefits can be added
- [ ] Sensitive payroll data is protected
- [ ] A payroll run can be created
- [ ] A payroll run can be edited before finalization
- [ ] Payslips can be generated
- [ ] Payslip lines are correct
- [ ] Gross pay is correct
- [ ] Net pay is correct
- [ ] A tax is correct
- [ ] AM bidrag is correct
- [ ] ATP is correct
- [ ] Holiday pay is correct
- [ ] Employee pension is correct
- [ ] Employer pension is correct
- [ ] Benefits are included correctly
- [ ] Mileage is included correctly if supported
- [ ] B income is included correctly if supported
- [ ] Zero report behavior works if required
- [ ] Payroll can be finalized
- [ ] Payroll submission works if included
- [ ] Submission logs are stored
- [ ] Payroll liabilities are visible
- [ ] Payroll liabilities are accurate
- [ ] Payroll posting creates the correct journal entries
- [ ] Payslip PDF generation works

## 26. Integrations marketplace
- [ ] Integration app catalog loads
- [ ] Integration app detail loads
- [ ] A company can connect an integration
- [ ] A company can disconnect an integration
- [ ] Connection status is visible
- [ ] Connected by user is stored
- [ ] Connected at timestamp is stored
- [ ] Last sync time is visible
- [ ] Last error time is visible
- [ ] Connection config updates work if supported

## 27. Integration sync, mappings, and webhooks
- [ ] Sync jobs are visible
- [ ] Sync job detail is visible
- [ ] Sync retry works
- [ ] Sync item level errors are visible if included
- [ ] Field mappings can be listed
- [ ] Field mappings can be created
- [ ] Field mappings can be updated
- [ ] Webhook events are stored
- [ ] Webhook processing state is visible
- [ ] Webhook related errors are traceable

## 28. Developer platform
- [ ] Developer apps can be created if included
- [ ] Developer app status is visible
- [ ] OAuth clients work if included
- [ ] API keys work if included
- [ ] Redirect URIs are handled correctly
- [ ] Scope handling works correctly
- [ ] Webhook URL handling works correctly
- [ ] Public API docs reflect real behavior
- [ ] Developer console endpoints work if included

## 29. Personal business tax flow
- [ ] Tax return packages can be created if included
- [ ] Tax package detail loads
- [ ] Tax calculation works
- [ ] Calculated fields show values
- [ ] Source data for calculated fields is visible where intended
- [ ] Manual overrides work if included
- [ ] Filing instructions are shown
- [ ] Advisor assignment works if included
- [ ] Mark filed flow works if included

## 30. Annual accounts workspace
- [ ] Annual accounts case can be created
- [ ] Annual accounts case detail loads
- [ ] Fiscal year is stored correctly
- [ ] Package type is stored correctly
- [ ] Case status is correct
- [ ] Readiness score is shown
- [ ] Case tasks are visible
- [ ] Task statuses are correct
- [ ] Outputs can be generated
- [ ] Generated output files are stored
- [ ] Advisor assignment works if included
- [ ] Mark filed works if included
- [ ] Advisor notes work if included

## 31. Support center
- [ ] Help articles can be listed
- [ ] Help article detail loads
- [ ] Search across help content works if included
- [ ] Support tickets can be created
- [ ] Support tickets can be listed
- [ ] Support ticket detail loads
- [ ] Support messages can be added
- [ ] Ticket status updates correctly
- [ ] Ticket close flow works
- [ ] Support entry points are visible in the app

## 32. Migration
- [ ] A migration case can be created
- [ ] Migration source system can be stored
- [ ] Migration contact person can be stored
- [ ] Migration files can be uploaded
- [ ] Migration case detail loads
- [ ] Validation issues are visible
- [ ] Validation severity is visible
- [ ] Resolved validation issues update correctly
- [ ] Migration completion flow works
- [ ] Migration progress tracker is clear

## 33. Onboarding and learning
- [ ] Onboarding checklist exists
- [ ] Onboarding tasks are visible
- [ ] Task completion can be updated
- [ ] Setup completeness is accurate if included
- [ ] Role based onboarding works if included
- [ ] Learning courses can be listed
- [ ] Learning course detail loads
- [ ] Learning lessons can be listed
- [ ] Learning content opens correctly
- [ ] Dashboard onboarding panel disappears when complete if intended

## 34. Financing and partner services
- [ ] Financing partners can be listed
- [ ] A financing lead can be created
- [ ] Requested amount is stored correctly
- [ ] Consent capture works
- [ ] Lead status is visible
- [ ] Lead list loads
- [ ] Lead detail loads
- [ ] Financing features stay outside the core bookkeeping navigation

## 35. Dashboard and navigation
- [ ] Main dashboard loads
- [ ] KPI cards show correct values
- [ ] Bank balance card is correct
- [ ] Overdue receivables card is correct
- [ ] Unpaid bills card is correct
- [ ] VAT due card is correct
- [ ] Turnover meter works if included
- [ ] Next payroll card works if included
- [ ] Quick actions are visible
- [ ] Recent activity is correct
- [ ] Assistant task panel works if included
- [ ] Cash and VAT widgets are correct
- [ ] Recent uploads are visible if intended
- [ ] Personalized widget layout works if included
- [ ] Dashboard preferences save correctly

## 36. Activity stream and auditability
- [ ] Activity events are stored for key actions
- [ ] Actor user is stored where appropriate
- [ ] Entity type is stored correctly
- [ ] Entity id is stored correctly
- [ ] Event summaries are understandable
- [ ] Activity feed is filtered to the right company
- [ ] Financial changes are auditable end to end

## 37. Data model and platform consistency
- [ ] UUID based identities work consistently
- [ ] created_at is present where expected
- [ ] updated_at is present where expected
- [ ] deleted_at soft delete behavior works where intended
- [ ] amount_minor plus currency_code is used consistently
- [ ] Enum backed statuses behave correctly
- [ ] Foreign key relationships are intact
- [ ] Soft deleted records do not break workflows
- [ ] Company scoped queries are enforced everywhere

## 38. Performance, reliability, and quality
- [ ] Key screens load within acceptable limits on realistic data
- [ ] Large lists support pagination
- [ ] Sorting works on core lists
- [ ] Filtering works on core lists
- [ ] Search works on core lists
- [ ] Empty states are useful
- [ ] Error messages are actionable
- [ ] Background jobs recover from failures where needed
- [ ] Sync and webhook retries are safe
- [ ] Cached dashboard data stays trustworthy if used
- [ ] Exports complete successfully
- [ ] Mobile receipt capture works
- [ ] Mobile basic approvals work if included
- [ ] Accessibility works on forms
- [ ] Accessibility works on tables
- [ ] Accessibility works on dialogs
- [ ] Keyboard navigation works on critical flows

## 39. Final workflow confirmation
- [ ] A new customer can complete account setup
- [ ] A company can configure billing and VAT settings
- [ ] A team member can be invited and assigned a role
- [ ] A customer contact can be created
- [ ] A product can be created
- [ ] A quote can be sent
- [ ] A quote can be converted to an invoice
- [ ] The invoice can be paid
- [ ] The invoice payment shows the correct balance impact
- [ ] A receipt can be uploaded
- [ ] The receipt can become an expense
- [ ] The expense posts correctly to the ledger
- [ ] VAT impact from the expense is correct
- [ ] Bank data can be imported or synced
- [ ] A bank line can be reconciled
- [ ] A VAT return can be prepared and reviewed
- [ ] Reports can be opened and trusted by an admin
- [ ] No blocker remains in the main Phase 1 workflow
- [ ] No critical accounting correctness issue remains open
- [ ] No critical permission or data isolation issue remains open
- [ ] Release signoff is complete