import { Injectable, HttpException, HttpStatus } from "@nestjs/common";
import { SupabaseService } from "../../core/supabase/supabase.service";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class UserService {
    
    constructor(
        private readonly supabase: SupabaseService,
    ){} 

    async findByEmail(email: string) {
        const { data, error } = await this.supabase.getClient()
            .from('event_attendees')
            .select('*')
            .eq('email', email)
            .maybeSingle(); 

        if (error) throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        return data;
    }

    async createAttendee(dto: RegisterDto) {
    const client = this.supabase.getClient();

    const { data, error } = await client
        .from('event_attendees')
        .insert([
        {
            email: dto.email,
            full_name: dto.full_name,
            event_id: dto.event_id,
            phone: dto.phone,
            user_id: dto.user_id,
            ticket_type: 'standard',
            status: 'confirmed',
            source: 'app',
            networking_visible: true
        }
        ])
        .select()
        .single();

    if (error) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }

    return data;
    }
        
}