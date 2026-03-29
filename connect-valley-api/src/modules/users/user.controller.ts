import { Controller, Post, Body, Get, UseGuards , Request} from "@nestjs/common";
import { UserService } from "./user.service";
import { RegisterDto } from "./dto/register.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth-guards";
import { CurrentUser } from "../auth/strategies/current-user.decorator";

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.userService.createAttendee(dto);
  }

  @Get('meu-perfil')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: any){
    return user;

  }

  @Get('profile-test')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
  return {
    message: 'Acesso concedido!',
    user: req.user, 
  };
}
}