import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('event_attendees') // Nome da tabela no banco do Connect
export class Attendee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  event_id: string;

  @Column({ type: 'uuid', nullable: true })
  user_id: string; // ID do Supabase Auth (será preenchido após o login)

  @Column()
  full_name: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: 'standard' })
  ticket_type: string;

  @Column({ type: 'uuid', nullable: true })
  party_id: string; // Vínculo com a tabela Parties do CRM

  @Column({ default: 'confirmed' })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}