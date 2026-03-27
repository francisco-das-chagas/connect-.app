import { IsEmail, IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Por favor, insira um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'O nome completo é obrigatório.' })
  full_name: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUUID('4', { message: 'O ID do evento deve ser um UUID válido.' })
  @IsNotEmpty({ message: 'O ID do evento é obrigatório.' })
  event_id: string;
}