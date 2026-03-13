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
	
