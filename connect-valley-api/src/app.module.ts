import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/user.module';
import { SupabaseModule } from './core/supabase/supabase.module';

@Module({
  imports: [
    // 1. Carrega o .env primeiro e deixa global
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '.env', // Garante que ele procure na raiz
    }),

    // 2. Conexão CONNECT (Usa forRootAsync para esperar o .env carregar)
    TypeOrmModule.forRootAsync({
      name: 'CONNECT_DB',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('CONNECT_DB_URL'),
        autoLoadEntities: true,
        synchronize: false,
        logging: true, // Ative para ver as queries no console
      }),
    }),

    // 3. Conexão CRM (Usa forRootAsync também)
    TypeOrmModule.forRootAsync({
      name: 'CRM_DB',
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('CRM_DB_URL'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),

    AuthModule,
    UsersModule,
    SupabaseModule,
  ],
})
export class AppModule {}