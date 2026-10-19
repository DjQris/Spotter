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
  m.name,
  m."memberNumber",
  now() + interval '365 days',
  now(),
  now()
FROM gym
CROSS JOIN (
  VALUES
    ('100006', 'Test Member 100006'),
    ('100007', 'Test Member 100007'),
    ('100008', 'Test Member 100008'),
    ('100009', 'Test Member 100009'),
    ('100010', 'Test Member 100010'),
    ('100011', 'Test Member 100011')
) AS m("memberNumber", name)
ON CONFLICT DO NOTHING;
