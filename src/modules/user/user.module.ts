import { Module } from "@nestjs/common";
import { UserController } from "./user.controller.js";
import { UserService } from "./user.service.js";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { RefreshTokenModule } from "../auth/refresh_token/refresh_token.module.js";

@Module({
    imports: [PrismaModule, RefreshTokenModule],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService]
})

export class UserModule {}