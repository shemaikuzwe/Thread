-- name: CreateChannel :one
INSERT INTO channels (name, description)
VALUES ($1, $2)
RETURNING *;

-- name: CreateChannelUser :exec
INSERT INTO channel_user (channel_id, user_id)
VALUES ($1, $2);

-- name: GetAllChannels :many
SELECT channels.*,users.first_name,users.last_name,users.email,users.id
FROM channels INNER JOIN channel_user
ON channels.id = channel_user.channel_id
INNER JOIN users ON channel_user.user_id = users.id;

-- name: GetChannelsByUserID :many
SELECT channels.*,users.first_name,users.last_name,users.email,users.id FROM channels INNER JOIN
channel_user ON channels.id = channel_user.channel_id
INNER JOIN users ON channel_user.user_id = users.id
WHERE channel_user.user_id = $1;

-- name: GetClientChannels :many
SELECT channels.id FROM channels INNER JOIN channel_user
ON channels.id = channel_user.channel_id
WHERE channel_user.user_id = $1;

-- name: GetChannelByID :one
SELECT channels.*,users.first_name,users.last_name,users.email,users.id FROM channels INNER JOIN
channel_user ON channels.id = channel_user.channel_id
INNER JOIN users ON channel_user.user_id = users.id
WHERE channels.id = $1;
