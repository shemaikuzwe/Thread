-- name: CreateChannel :one
INSERT INTO channels (name, description, type)
VALUES ($1, $2, $3)
RETURNING id;

-- name: CreateChannelUser :exec
INSERT INTO channel_user (channel_id, user_id)
VALUES ($1, $2);

-- name: CreateDMChannel :one
INSERT INTO channels (type)
VALUES ($1)
RETURNING id;

-- name: CreateDMChannelUsers :exec
INSERT INTO channel_user (channel_id, user_id)
VALUES ($1, $2),($1, $3);

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
WHERE channels.name ILIKE $1 OR ((users.first_name ILIKE $1 OR users.last_name ILIKE $1 ) AND channels.type='dm')
GROUP BY channels.id;

-- name: GetChannelsByUserID :many
SELECT channels.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'email', users.email
)) AS users
FROM channels
JOIN channel_user cu1 ON channels.id = cu1.channel_id
JOIN channel_user cu2 ON channels.id = cu2.channel_id
JOIN users ON cu2.user_id = users.id
WHERE cu1.user_id = $1
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

-- name: GetDMChannel :one
SELECT c.id, c.type
FROM channels c
JOIN channel_user cu1 ON c.id = cu1.channel_id
JOIN channel_user cu2 ON c.id = cu2.channel_id
WHERE c.type = 'dm'
  AND cu1.user_id = $1
  AND cu2.user_id = $2
GROUP BY c.id
HAVING COUNT(DISTINCT cu1.user_id) = 1 AND COUNT(DISTINCT cu2.user_id) = 1;

-- name: GetChannelAndUser :many

SELECT c.id,c.name,'group' as type FROM channels c WHERE c.name ILIKE $1 AND c.is_private=false
UNION
SELECT DISTINCT u.id,CONCAT(u.first_name,' ',u.last_name) as name,'user' as type FROM users u
WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1;
-- name: JoinChannel :exec

INSERT INTO channel_user (channel_id, user_id)
VALUES ($1, $2);
