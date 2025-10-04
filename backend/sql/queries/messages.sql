-- name: GetChannelMessages :many
SELECT messages.*,users.first_name,users.last_name FROM messages
INNER JOIN users ON messages.user_id = users.id
WHERE messages.channel_id = $1
ORDER BY messages.created_at ASC
LIMIT 10;

-- name: CreateMessage :exec
INSERT INTO messages (channel_id, user_id, message)
VALUES ($1, $2, $3);
