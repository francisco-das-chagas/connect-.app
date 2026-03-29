import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth-guards';
import { CurrentUser } from './strategies/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body('email') email: string,
    @Body('password') password: string) 
  {
    return this.authService.login(email, password);
  }

  @Post('magic-link')
  @HttpCode(HttpStatus.OK)
  async sendMagicLink(@Body('email') email: string){
    return this.authService.sendMagicLink(email)
  }


}