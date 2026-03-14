FROM golang:1.24-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o thread

FROM alpine:3.20 AS runtime
WORKDIR /app
RUN apk add --no-cache ca-certificates
COPY --from=builder /app/thread ./thread
EXPOSE 8001
CMD ["/app/thread"]
