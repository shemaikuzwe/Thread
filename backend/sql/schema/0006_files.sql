-- +goose Up

CREATE TABLE files(
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
url TEXT NOT NULL,
type VARCHAR(255) NOT NULL,
size INT NOT NULL,
message_id UUID NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT now(),
updated_at TIMESTAMP NOT NULL DEFAULT now(),
FOREIGN KEY(message_id) REFERENCES messages(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- +goose Down

DROP TABLE files;
