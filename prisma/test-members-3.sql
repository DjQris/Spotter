-- Three unclaimed test members for local sign up testing. Local database only.
-- No email, no password. name is NOT NULL in the schema, so it is set to an
-- empty string; sign up overwrites it with the full name the member enters.
WITH gym AS (
  SELECT id
  FROM "Gym"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
INSERT INTO "Member" (
  "id",
  "gymId",
  "name",
  "memberNumber",
  "expiryDate",
  "createdAt",
  "updatedAt"
)
SELECT
  'test-member-' || m."memberNumber",
  gym.id,
  '',
  m."memberNumber",
  now() + interval '365 days',
  now(),
  now()
FROM gym
CROSS JOIN (
  VALUES
    ('100014'),
    ('100015'),
    ('100016')
) AS m("memberNumber")
ON CONFLICT DO NOTHING;
