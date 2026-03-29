import { Injectable, UnauthorizedException, Inject, forwardRef, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { SupabaseService } from 'src/core/supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    // private readonly jwtService: JwtService,
    private readonly supabaseService: SupabaseService
  ) {}

  async linkUserToAttendee(email: string, supabaseUserId: string){
    const client = this.supabaseService.getClient();

    const { data, error } = await client
      .from('event_attendees')
      .update({ user_id: supabaseUserId })
      .eq('email', email)
      .is('user_id', null);

    if(error){
      console.error('Erro ao vincular user_id:', error.message);
    }

    return data;
  }


  async sendMagicLink(email: string){
    const client = this.supabaseService.getClient()

    const { data: userExists } = await client
    .from('event_attendees')
    .select('id, full_name')
    .eq('email', email)
    .maybeSingle();

    if(!userExists){
      throw new HttpException(
        'Email não encontrado na lista de pasticipantes do envento',
        HttpStatus.NOT_FOUND
      );
    }

    const { error } = await client.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: 'http://localhost:3000/dashboard',
      },
    });

    if(error){
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST)
    }

    return { message: 'Link de login enviado com sucesso para o seu e-mail!' };
  }

  async login(email: string, password: string) {
    
    const attendee = await this.userService.findByEmail(email);

    if (!attendee) {
      throw new UnauthorizedException('Usuário não encontrado ou credenciais inválidas');
    }

    const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
      email: email,
      password: password,
      // options: {
      //   emailRedirectTo: 'http://localhost:3000/dashboard'
      // },
    });

    if(error) throw new UnauthorizedException(error.message);

    const payload = { 
      email: attendee.email, 
      sub: attendee.id,
      role: attendee.role || 'user' 
    };

    await this.linkUserToAttendee(email, data.user.id);
    return {
      message: 'Login realizado com sucesso!',
      access_token: data.session.access_token,
      user: {
        id: attendee.id,
        email: attendee.email,
        full_name: attendee.full_name
      }
    };
  }
}