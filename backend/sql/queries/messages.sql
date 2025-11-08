-- name: GetChannelMessages :many
SELECT
  m.*,
  json_build_object(
    'id', u.id,
    'first_name', u.first_name,
    'last_name', u.last_name,
    'email', u.email,
    'profile_picture', u.profile_picture
  ) AS "from",
  COALESCE(
  json_arrayagg(
    json_build_object(
      'id', f.id,
      'url', f.url,
      'type', f.type,
      'size', f.size,
      'name',f.name
    )
    ORDER BY f.id
    ABSENT ON NULL
  ) FILTER (WHERE f.id IS NOT NULL),
  '[]'
  )::json
  AS files
FROM messages m
INNER JOIN users u ON m.user_id = u.id
LEFT JOIN files f ON f.message_id = m.id
WHERE m.channel_id = $1
GROUP BY m.id, u.id
ORDER BY m.created_at ASC;
-- LIMIT 10;

-- name: CreateMessage :one
INSERT INTO messages (id,channel_id, user_id, message,created_at)
VALUES ($1, $2, $3 ,$4,$5)
RETURNING id;

-- name: CreateFiles :exec
INSERT INTO files(url,name,type,size,message_id)
VALUES ($1,$2,$3,$4,$5);
