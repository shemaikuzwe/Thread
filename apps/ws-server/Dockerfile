FROM golang:alpine

WORKDIR /app

COPY . .

RUN go mod download

RUN go build -o thread

CMD ["/app/thread"]
