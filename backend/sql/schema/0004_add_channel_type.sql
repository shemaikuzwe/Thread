-- +goose Up
ALTER TABLE channels DROP COLUMN is_channel;
CREATE TYPE channel_type AS ENUM ('group', 'dm');
ALTER TABLE channels ADD COLUMN type channel_type NOT NULL DEFAULT 'group';
-- +goose Down
ALTER TABLE channels DROP COLUMN type;
DROP TYPE channel_type;
ALTER TABLE channels ADD COLUMN is_channel BOOLEAN NOT NULL DEFAULT false;
