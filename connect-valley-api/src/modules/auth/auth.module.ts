import { forwardRef, Module } from "@nestjs/common";
import { UsersModule } from "../users/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth-guards";

@Module({
  imports: [
    forwardRef(() => UsersModule),
  ],
  providers: [AuthService, JwtAuthGuard], 
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}