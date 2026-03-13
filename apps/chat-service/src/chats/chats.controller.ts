import { Controller } from "@nestjs/common";
import { GrpcMethod } from "@nestjs/microservices";


@Controller()
export class ChatsController{
    @GrpcMethod("ChatService","SaveMessage")
    async saveMessage(data){

    }

}
