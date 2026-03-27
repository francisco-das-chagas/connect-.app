import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Party } from "./entities/party.entity";
import { Repository } from "typeorm";
import { Attendee } from "./entities/attendee.entity";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class UserService {
   
    
    constructor(
        @InjectRepository(Party, 'CRM_DB')
        private crmRepo: Repository<Party>,

        @InjectRepository(Attendee, 'CONNECT_DB')
        private attendeeRepo: Repository<Attendee>,
    ){} 


    async findByEmail(email: string) {
        return this.attendeeRepo.findOne({
            where:{email},
        })
    }
   async findOrCreateAttendee(dto: RegisterDto) {
    // 1. PULAMOS O CRM: Não fazemos save no crmRepo.
    // Apenas definimos um ID temporário para o vínculo não quebrar
    const fakePartyId = '00000000-0000-0000-0000-000000000000'; 

    // 2. FOCO TOTAL NO CONNECT (Banco do Evento)
    let attendee = await this.attendeeRepo.findOne({
        where: { email: dto.email, event_id: dto.event_id }
    });

    if (!attendee) {
        attendee = this.attendeeRepo.create({
            event_id: dto.event_id,
            full_name: dto.full_name,
            email: dto.email,
            phone: dto.phone,
            party_id: fakePartyId, // Usamos o ID fake aqui
            ticket_type: 'standard', // Ou a lógica que você preferir
            status: 'confirmed'
        });

        // SALVA APENAS NO BANCO CONNECT
        attendee = await this.attendeeRepo.save(attendee);
    }

    return attendee;
}
}