-- name: CreateThread :one
INSERT INTO thread (name, description, type)
VALUES ($1, $2, $3)
RETURNING id;

-- name: CreateThreadUser :exec
INSERT INTO thread_user (thread_id, user_id)
VALUES ($1, $2);

-- name: CreateDMThread :one
INSERT INTO  thread (type)
VALUES ($1)
RETURNING id;

-- name: CreateDMThreadUsers :exec
INSERT INTO thread_user (thread_id, user_id)
VALUES ($1, $2),($1, $3);

-- name: GetAllThreads :many
SELECT  thread.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'profile_picture',users.profile_picture,
'email', users.email)) AS users
FROM thread INNER JOIN thread_user
ON thread.id = thread_user.thread_id
INNER JOIN users ON thread_user.user_id = users.id
GROUP BY  thread.id;

-- name: GetThreadsByUserID :many
SELECT
    thread.*,
    json_agg(json_build_object(
        'id', users.id,
        'first_name', users.first_name,
        'last_name', users.last_name,
        'email', users.email,
        'profile_picture', users.profile_picture
    )) AS users,
    COALESCE(
        (
            SELECT json_build_object(
                'id', m.id,
                'message', m.message,
                'user_id', m.user_id,
                'created_at', m.created_at
            )
            FROM messages m
            WHERE m.thread_id = thread.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        'null'
    )::json AS last_message
FROM thread
JOIN thread_user cu1 ON thread.id = cu1.thread_id
JOIN thread_user cu2 ON thread.id = cu2.thread_id
JOIN users ON cu2.user_id = users.id
WHERE cu1.user_id = $1
GROUP BY thread.id;

-- name: GetUnReadChatsByUserID :many
SELECT
  l.last_read_message_id AS last_read,
  l.thread_id,
  (
    SELECT COUNT(m.id)
    FROM messages m
    WHERE
      m.thread_id = l.thread_id
      AND m.user_id != $1
     AND m.created_at > lm.created_at

  ) AS unread_count
FROM last_read l
JOIN messages lm ON l.last_read_message_id = lm.id
WHERE l.user_id = $1;

-- name: GetClientThreads :many
SELECT  thread.id FROM thread INNER JOIN thread_user
ON  thread.id = thread_user.thread_id
WHERE thread_user.user_id = $1;

-- name: GetThreadByID :one
SELECT  thread.*,json_agg(json_build_object(
'id', users.id,
'first_name', users.first_name,
'last_name', users.last_name,
'profile_picture',users.profile_picture,
'email', users.email)) AS users
FROM thread INNER JOIN thread_user
ON thread.id = thread_user.thread_id
INNER JOIN users ON thread_user.user_id = users.id
WHERE  thread.id = $1
GROUP BY thread.id;

-- name: GetThreadUsers :many

SELECT u.id FROM users u
JOIN thread_user tu ON tu.user_id =u.id
JOIN thread t ON t.id=tu.thread_id
WHERE t.id=$1;

-- name: GetDMThread :one
SELECT t.id, t.type
FROM  thread t
JOIN thread_user tu1 ON t.id = tu1.thread_id
JOIN thread_user tu2 ON t.id = tu2.thread_id
WHERE t.type = 'dm'
  AND tu1.user_id = $1
  AND tu2.user_id = $2
GROUP BY t.id;
-- name: GetThreadAndUser :many

SELECT t.id,t.name,'group' as type FROM  thread t WHERE t.name ILIKE $1 AND t.is_private=false
UNION
SELECT DISTINCT u.id,CONCAT(u.first_name,' ',u.last_name) as name,'user' as type FROM users u
WHERE u.first_name ILIKE $1 OR u.last_name ILIKE $1;

-- name: JoinThread :exec

INSERT INTO thread_user (thread_id, user_id)
VALUES ($1, $2);

-- name: UpsertLastRead :exec

INSERT INTO last_read(thread_id,last_read_message_id,user_id)
VALUES($1,$2,$3) ON CONFLICT(user_id,thread_id)
DO UPDATE SET last_read_message_id = EXCLUDED.last_read_message_id,updated_at=now();
