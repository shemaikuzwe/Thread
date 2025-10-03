-- +goose Up

CREATE TABLE channels(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE messages(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now(),
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE channel_user(
   channel_id UUID NOT NULL,
   user_id UUID NOT NULL,
   PRIMARY KEY (channel_id, user_id),
   FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE ON UPDATE CASCADE,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- +goose Down

DROP TABLE messages;
DROP TABLE channel_user;
DROP TABLE channels;
