---
trigger: always_on
---

# Copy

This file holds the member facing strings that are fixed. Copy them exactly.

Every string lives in src/lib/copy.ts and is imported from there. No member
facing string is written inline in a component.

Reason: these words were chosen for legal and trust reasons, a one word change
can reverse a deliberate product decision, and a string pasted into a component
drifts the first time someone edits that component.

## Placeholders

Placeholders are written in braces and are the only thing you may substitute:
{name}, {amount}, {date}, {code}, {seconds}. Nothing else in a string changes.

## Refusals

Records refusal, when the gym has no record:
  "I do not have that in the gym's records."
Nothing is added. No apology, no suggestion, no near answer, no description of
what most gyms do.

Medical refusal:
  "I cannot answer questions about injuries or health. Please speak to {name} or
  your doctor."

Door refusal:
  "I cannot tell you whether the door will open. Please speak to {name}."

Every refusal names a specific person, never "the front desk".

Reason: a named person gets messaged. A department does not.

## Money

Balance answers report, they never rule.

Correct:
  "Our records show {amount} outstanding for {date}."
Forbidden:
  "You owe {amount}."

Every balance answer ends with:
  "Correct as of {date}, based on payments recorded here."

Reason: the first can be corrected without anyone losing face. The second starts
an argument at the front desk. Same data, different cost.

## Stale figures

When a cached balance is more than twenty four hours old, hide the figure and
show:
  "Open to refresh"

## Empty states

  "No check ins recorded for {date}."
  "No payments recorded yet. Ask the front desk if you paid in cash."
  "0 days this month"
The last one is a number, not an error.

## Sign up

  "Enter the member number on your gym card."
  "We could not find that member number. Check it with the front desk."
  "That member number already has an account. Ask the front desk for help."
  "That member number was reserved for another email address. Ask the front desk for help."
  "That email is already registered."
  "Use at least eight characters."
  "That password has appeared in a data breach. Choose a different one."

The member number messages distinguish not found from already claimed, because
both send her to the desk and the desk needs to know which one it is.

Reason: this is the one place where a specific error is safer than a vague one.
A member number is not a secret, and a vague message here produces a phone call
the desk cannot resolve.

The breach message is shown under the password field on sign up and on the
password change screen when the Pwned Passwords corpus lists the password.

## Login

  "That email and password do not match."

One message covers a wrong email and a wrong password alike. It never says which
one was wrong and never says whether the email is registered.

  "Too many attempts. Try again in fifteen minutes."

  "Too many attempts. Try again in an hour."

## Temporary password

  "Set a new password to continue."
  "That temporary password has expired. Ask the front desk for a new one."
  "Ask the front desk for a temporary password to reset your account."
  "Password changed. You can now log in."

## Email verification

  "Verify your email"
  "We sent a six digit code to {email}. Enter it below to verify your email."
  "Six digit code"
  "Verify"
  "Checking..."
  "Send a new code"
  "Sending..."
  "We sent a new code to {email}."
  "That code is wrong or has expired. Send a new code."
  "We could not send the code right now. Try again."
  "Sign in to verify your email."

The banner sits on the dashboard until the email is verified. Nothing is
blocked while an email is unverified; the banner is the only prompt.

## Account deletion

  "Delete account"
  "Your account locks now. After seven days your data is deleted and your
  identity is removed. Payment records are kept for seven years. This cannot be
  undone."
  "Enter your password to confirm."
  "Delete my account"
  "Keep my account"
  "Deleting..."
  "That password is wrong."
  "This account is scheduled for deletion."
  "Sign in to continue."

The first string is the dashboard control. The warning and the confirm strings
sit with the confirm form. The scheduled message is shown when a scheduled
member tries to log in. The last string covers a missing session on the delete
request.

## Form validation

  "This field must not be empty"
  "Use at least two characters."
  "Enter at least two names."
  "Enter a valid email address"
  "Enter your 6 digit member number."
  "Please accept the privacy terms to continue."
  "Complete every field and accept the privacy terms to create your account."

The first is shown inline under any form field the member focused and left
without typing. The name messages apply to the full name field on sign up. The
email message is shown live as the member types the sign up email address and
clears when the format is valid. The member number message applies when the
sign up member number is not exactly six digits. The privacy terms message is
shown inline under the checkbox when the member clicks the disabled create
account button with every field valid but the checkbox unchecked. The create
account hint is read by a screen reader when the create account button is
focused while the form is incomplete.

## Check in

  "Type this code at the door"
  "Expires in {seconds} seconds"
  "Checking you in"
  "Checked in"
  "That code expired. Tap to get a new one."
  "You are already checked in today"
  "The gym is closed right now. Check in when it opens."
  "Renew to check in"
  "Still confirming. Keep this screen open."

The last one is shown when polling fails. It never says the check in failed,
because the code may already have been consumed.

Reason: telling her it failed when it succeeded makes her try again, and the one
per day rule then refuses her, and she believes the app lost her visit.

## Payments

  "We are confirming a payment of {amount} from {date}."
  "Nothing due."
  "Payment could not start. Try again or pay at the desk."
  "Enter your password to continue."

## Errors

Model or retrieval unreachable:
  "I cannot reach the gym's records right now"
Private records unreachable:
  "I cannot read your records right now"
Sign out failed:
  "We could not sign you out. Try again."

Never return a zero when a read failed. A zero is an answer. An error is not.

## Card age

When a card is past its review date the answer carries:
  "This was last confirmed on {date}."

Reason: the age of a record is never hidden from the member.

## Metadata

  "Official gym member portal"

## Navigation

  "Get Started"
  "Get Started for Free"
  "Privacy Policy"
  "Terms of Service"

The two legal labels are the footer links. Each matches a document title below.

## Legal pages

The privacy policy and the terms of service are fixed member facing documents.
Their full text lives in src/lib/copy.ts as `legalCopy` and is rendered as
views on the home page, opened from the footer. Treat every sentence in them as
a fixed string: do not reword one without the review a change to any string in
this file gets.

The facts below are fixed by the PRD and rules/privacy.md. No edit may
contradict them.

- The gym is the data controller. The developer is a processor. Both documents
  say this. The Nigeria Data Protection Act 2023 grounds it.
- Retention. Attendance, question logs, access logs and check in codes: twenty
  four months. Payment records and receipts: seven years. Member identity
  records: while active, and twenty four months after cancellation.
- Account deletion. A member can request deletion from her dashboard. The
  account locks immediately and her record is purged seven days later. Payment
  records and receipts survive the purge for seven years.
- A check in records a claimed arrival. It is not proof of presence, and the
  app does not open the door.
- The terms list the never answer categories: another member, medical, whether
  the door will open right now, refunds, waivers, discounts and cancellation
  decisions, staff conduct.
- Payments go through Flutterwave. Only a confirmed payment extends membership.
  Nothing is billed automatically.
- The privacy policy names the Nigeria Data Protection Commission and the
  rights under the Nigeria Data Protection Act 2023.
- Governing law: the laws of the Federal Republic of Nigeria.

## Marketing

  "Check in, view your records and balance,"
  "and get verified gym answers."

Stored as heroSubtitleLead and heroSubtitleTail. The tail renders on its own
line.

## Welcome email

  "Welcome to Spotter"
  "Hi {name},"
  "Your account is ready. Spotter is your gym member app."
  "Check in at the gym with a six digit code."
  "View your attendance and balance."
  "Ask about the gym and get answers from the gym's records."
  "You received this email because you created a Spotter account. If this was
  not you, speak to the front desk."

The subject line is the first string. The greeting carries the only
substitution. The email is sent once, in the background, the moment the account
is created. It is triggered by the member's own sign up, not by the gym.

## Member number email

  "Your Spotter member number"
  "Hello,"
  "Your member number"
  "Use this member number to create your Spotter account."
  "You received this email because the front desk generated a member number
  for this address. If this was not you, speak to the front desk."

The subject line is the first string. This email is sent when the front desk
generates a member number for an email address.

## Verification email

  "Verify your email for Spotter"
  "Hi {name},"
  "Verify your email"
  "Enter this code in the app to verify your email address."
  "This code expires in two minutes."
  "You received this email because a Spotter account was created with this
  address. If this was not you, ignore this email."

The subject line is the first string. The email is sent automatically the first
time the dashboard loads for an unverified member with no code stored, and
retried on later loads until one is stored. The banner's resend control sends
it again.

## Tone for anything not listed

Plain English. Short sentences. Active voice. No em dashes. No apology. No
follow up question. No offer of further help.

If you need a string that is not here, write it in that tone, flag it in your
response, and add it to this file and to src/lib/copy.ts in the same change.

## OPEN

The PRD assumes English. Whether any other language is needed is not stated. Ask
before adding any translation machinery.