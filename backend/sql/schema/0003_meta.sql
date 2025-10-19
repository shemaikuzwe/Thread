-- +goose Up

ALTER TABLE channels ADD COLUMN is_channel BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE channels ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false;
-- +goose Down

ALTER TABLE channels DROP COLUMN is_channel;
ALTER TABLE channels DROP COLUMN is_private;
