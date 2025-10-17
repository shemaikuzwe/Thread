-- name: CreateChannel :one
INSERT INTO channels (name, description)
VALUES ($1, $2)
RETURNING *;

-- name: CreateChannelUser :exec
INSERT INTO channel_user (channel_id, user_id)
VALUES ($1, $2);

-- name: GetAllChannels :many
SELECT channels.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'email', users.email)) AS users
FROM channels INNER JOIN channel_user
ON channels.id = channel_user.channel_id
INNER JOIN users ON channel_user.user_id = users.id
GROUP BY channels.id;

-- name: GetChannelsByName :many
SELECT channels.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'email', users.email)) AS users
FROM channels INNER JOIN channel_user
ON channels.id = channel_user.channel_id
INNER JOIN users ON channel_user.user_id = users.id
WHERE channels.name ILIKE $1
GROUP BY channels.id;

-- name: GetChannelsByUserID :many
SELECT channels.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'email', users.email)) AS users
FROM channels INNER JOIN channel_user
ON channels.id = channel_user.channel_id
INNER JOIN users ON channel_user.user_id = users.id
WHERE channel_user.user_id = $1
GROUP BY channels.id;

-- name: GetClientChannels :many
SELECT channels.id FROM channels INNER JOIN channel_user
ON channels.id = channel_user.channel_id
WHERE channel_user.user_id = $1;

-- name: GetChannelByID :one
SELECT channels.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'email', users.email)) AS users
FROM channels INNER JOIN channel_user
ON channels.id = channel_user.channel_id
INNER JOIN users ON channel_user.user_id = users.id
WHERE channels.id = $1
GROUP BY channels.id;


-- name: JoinChannel :exec

INSERT INTO channel_user (channel_id, user_id)
VALUES ($1, $2);
