-- name: GetChannelMessages :many
SELECT messages.*,users.first_name,users.last_name FROM messages INNER JOIN
users ON messages.user_id = users.id
WHERE messages.channel_id = $1;
