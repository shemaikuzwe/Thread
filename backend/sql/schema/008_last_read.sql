-- +goose Up

CREATE TABLE last_read(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 channel_id UUID NOT NULL,
 last_read_message_id UUID NOT NULL,
 user_id UUID NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT now() ,
 updated_at TIMESTAMP NOT NULL DEFAULT now(),
 FOREIGN KEY(channel_id) REFERENCES channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
 FOREIGN KEY(last_read_message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT unique_user_channel UNIQUE(user_id,channel_id)
);

-- +goose Down

DROP TABLE last_read;
