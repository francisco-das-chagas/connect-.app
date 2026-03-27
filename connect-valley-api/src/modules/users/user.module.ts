import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { Party } from './entities/party.entity';
import { Attendee } from './entities/attendee.entity';

@Module({
  imports: [
    // REGISTRO DOS REPOSITÓRIOS NAS CONEXÕES CORRETAS
    TypeOrmModule.forFeature([Party], 'CRM_DB'),    // Party vai para o CRM
    TypeOrmModule.forFeature([Attendee], 'CONNECT_DB'), // Attendee vai para o CONNECT
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService], // Exporta para o AuthModule poder usar
})
export class UsersModule {}