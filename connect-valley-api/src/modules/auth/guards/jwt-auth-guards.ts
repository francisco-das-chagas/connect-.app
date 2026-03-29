import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from 'src/core/supabase/supabase.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('Token não fornecido');
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await this.supabase.getClient().auth.getUser(token);

    if (error || !user) {
      console.error('Erro de validação Supabase:', error?.message);
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    request.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return true;
  }
}