import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    console.log('--- DEBUG: TENTANDO INICIAR STRATEGY ---');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // Vamos ignorar expiração por 1 minuto para testar
      secretOrKey: Buffer.from(secret || '', 'base64'),
      // REMOVEMOS: audience e issuer para não dar conflito de string
      algorithms: ['HS256', 'ES256'],
    });
  }

  async validate(payload: any) {
    console.log('--- FINALMENTE NO VALIDATE! ---');
    console.log('Payload recebido:', payload);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}