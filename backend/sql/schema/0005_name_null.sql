-- +goose Up

ALTER TABLE channels
ALTER COLUMN name DROP NOT NULL;


-- +goose Down

ALTER TABLE channels
ALTER COLUMN name SET NOT NULL;
