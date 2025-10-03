-- name: CreateChannel :one
INSERT INTO channels (name, description)
VALUES ($1, $2)
RETURNING *;

-- name: GetAllChannels :many
SELECT * FROM channels;

-- name: GetChannelsByUserID :many
SELECT channels.* FROM channels INNER JOIN
channel_user ON channels.id = channel_user.channel_id
WHERE channel_user.user_id = $1;

-- name: GetChannelByID :one
SELECT * FROM channels WHERE id = $1;
