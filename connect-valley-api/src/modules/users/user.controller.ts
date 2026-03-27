import { Body, Controller, Get, Request ,Param, Post } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { AuthResponseDto } from "../auth/dto/auth-response.dto";
import { UserService } from "./user.service";
import { AuthService } from "../auth/auth.service";

@Controller('users')
export class UserController{
    constructor(private readonly userService: UserService,
        private readonly authService: AuthService
    ){}

    
    
    @Get('profile/:email')
    async getProfile(@Param('email') email: string){
        return this.userService.findByEmail(email)
    }

    @Get('me')
    getMe(@Request() req){
        return req.user;
    }
}
