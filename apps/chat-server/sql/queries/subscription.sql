-- name: CreateSubscription :exec

INSERT INTO subscription(user_id,sub,endpoint)
VALUES($1,$2,$3);

-- name: UnSubscribeUser :exec

DELETE FROM subscription WHERE endpoint=$1 AND user_id=$2;

-- name: GetUserSubscription :many

SELECT * FROM subscription WHERE user_id=$1;
