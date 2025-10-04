-- name: GetChannelMessages :many
SELECT messages.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'email', users.email,
'profile_picture', users.profile_picture
)) AS from
FROM messages
INNER JOIN users ON messages.user_id = users.id
WHERE messages.channel_id = $1
GROUP BY messages.id
ORDER BY messages.created_at ASC
LIMIT 10;

-- name: CreateMessage :exec
INSERT INTO messages (channel_id, user_id, message)
VALUES ($1, $2, $3);
