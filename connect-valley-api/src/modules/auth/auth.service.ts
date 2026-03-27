import { BadRequestException, Injectable } from "@nestjs/common";
import { RegisterDto } from "../users/dto/register.dto";
import { UserService } from "../users/user.service";
import { SupabaseService } from "src/core/supabase/supabase.service";

@Injectable()
export class AuthService{
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly userService: UserService,
    ){}

    async processMagicLink(dto: RegisterDto){
        const attendee = await this.userService.findOrCreateAttendee(dto);

        const {error} = await this.supabaseService.getClient().auth.signInWithOtp({
            email: dto.email,
            options: {
                emailRedirectTo: 'http://localhost:3000/callback',
                data: {
                    full_name: dto.full_name,
                    party_id: attendee.party_id,
                    ticket_type: attendee.ticket_type
                }
            }
        });

        if(error) throw new BadRequestException(`Erro Supabase: ${error.message}`);

        return {
            message: 'Verifique seu email para acessar o connect valley',
            ticket_type: attendee.ticket_type, // O campo que estava faltando
            email: dto.email
        }
    }
}