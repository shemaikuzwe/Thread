-- name: CreateUser :one
INSERT INTO users(first_name,last_name,email,profile_picture,password)
VALUES($1,$2,$3,$4,$5)
RETURNING *;

-- name: GetUserById :one

SELECT * FROM users WHERE id=$1;

-- name: GetUsers :many

SELECT id, first_name, last_name, email, profile_picture FROM users;

-- name: GetUserByEmail :one

SELECT * FROM users WHERE email=$1;
