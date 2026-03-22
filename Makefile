-include .env
export 
PROTO_DIR=apps/chat-service
GO_OUT=apps/ws-server/internal
TS_OUT=apps/chat-service/src/chat-pb
PATH := node_modules/.bin:$(PATH)

generate-go:
	mkdir -p $(GO_OUT)
	protoc -I $(PROTO_DIR) \
	--go_out=$(GO_OUT) \
	--go-grpc_out=$(GO_OUT) \
	$(PROTO_DIR)/*.proto

generate-ts:
	mkdir -p $(TS_OUT)
	protoc -I $(PROTO_DIR) \
	--ts_proto_out=$(TS_OUT) \
	--ts_proto_opt=outputServices=grpc-js \
	$(PROTO_DIR)/*.proto

generate: generate-go generate-ts

build-api:
	docker build -f apps/api/Dockerfile . -t thread-api \
		--build-arg TURBO_TEAM=$(TURBO_TEAM) \
		--build-arg TURBO_TOKEN=$(TURBO_TOKEN)

build-web:
	docker build -f apps/web/Dockerfile . -t thread-web \
		--build-arg TURBO_TEAM=$(TURBO_TEAM) \
		--build-arg TURBO_TOKEN=$(TURBO_TOKEN) \
		--build-arg NEXT_PUBLIC_API_URL=$(NEXT_PUBLIC_API_URL) \
		--build-arg NEXT_PUBLIC_WS_URL=$(NEXT_PUBLIC_WS_URL) \
		--build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=$(NEXT_PUBLIC_VAPID_PUBLIC_KEY) 

build-chat-service:
	docker build -f apps/chat-service/Dockerfile . -t thread-chat-service

build-notification:
	docker build -f apps/notification/Dockerfile . -t thread-notification

build-ws-server:
	docker build -f apps/ws-server/Dockerfile ./apps/ws-server -t thread-ws-server

build-all: build-api build-web build-chat-service build-notification build-ws-server
	
