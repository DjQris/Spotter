100006, 100007, 100008, 100009, 100010

data normalization
ZOD ( Schema validation library ) 
Salting
Hashing
Trimming of email and password input
IP Rate limiting 
Breached Password list
Email verification -> 6 Digit Verification code
( randomBytes.crpto())

Sessions -> Logs in
- Zod
- Normalization(trim & lowercase)
- Lookup the user by email
- Argon2.verify()
- Ratelimiting 
- Error message with no directly clues
- For every login, verify email verification status 
- Issue a fresh sesdsion token on every sign in

# Use a middleware to
- Read session cookie. and if there is no session cookie we asked them to login
- Ensure that session tokens are hashed
- Check if user is still valid and not banned or locked for a moment
- Attach the user to the request so that browser pages will know who is logged in

# Logging out
- Loggin out has to be server side. Delete the session row from the database and clear the cookie.

# Password change
- Delete all sessions that have ever existed for that user

# Deleting of a user
- Do not delete manually from a database
- Implement a deletion job that does not delete the users detail instantly from the db when they request for their account to be deleted

- Soft delete ( scheduled for deletion )
- Grace period (waiting window)
- Hard delete (purging of data after grace period)
- Scheduled job ( runs everyday and checks for records that are scheduled for deletion. If the grace period has expired, it purges the data from the database)


# Onboarding Flow
- Education / Awareness
- Data collection
- Marketing


- Progressive component
- Motion education using GSAP or lottie animations
- There must be a skip option

# Receptionist/Admin flow
- Create a dashboard for the receptionist to use in creating member numbers
- protected route