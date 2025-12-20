-- +goose Up

CREATE TYPE thread_type AS ENUM ('group', 'dm');

CREATE TABLE thread(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  description TEXT,
  is_private BOOLEAN NOT NULL DEFAULT false,
  type thread_type NOT NULL DEFAULT 'group',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE messages(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (thread_id) REFERENCES thread(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE thread_user(
   thread_id UUID NOT NULL,
   user_id UUID NOT NULL,
   PRIMARY KEY (thread_id, user_id),
   FOREIGN KEY (thread_id) REFERENCES thread(id) ON DELETE CASCADE ON UPDATE CASCADE,
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- +goose Down

DROP TABLE messages;
DROP TYPE thread_type;
DROP TABLE thread_user;
DROP TABLE  thread;
