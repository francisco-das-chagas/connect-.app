import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthResponseDto } from "./dto/auth-response.dto";
import { RegisterDto } from "../users/dto/register.dto";

@Controller('auth')
export class AuthController{
    constructor(private readonly authService: AuthService){}

    @Post('register-and-login')
    @HttpCode(HttpStatus.OK)
    async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
        return this.authService.processMagicLink(dto);
    }
}