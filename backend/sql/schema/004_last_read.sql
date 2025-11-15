-- +goose Up

CREATE TABLE last_read(
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 thread_id UUID NOT NULL,
 last_read_message_id UUID NOT NULL,
 user_id UUID NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now() ,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 FOREIGN KEY(thread_id) REFERENCES thread(id) ON DELETE CASCADE ON UPDATE CASCADE,
 FOREIGN KEY(last_read_message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT unique_user_channel UNIQUE(user_id,thread_id)
);

-- +goose Down

DROP TABLE last_read;
