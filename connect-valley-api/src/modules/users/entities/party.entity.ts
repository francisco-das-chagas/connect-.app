import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('parties')
export class Party{
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({nullable : true })
    name: string;

    @Column({ nullable: true })
    email: string

    @Column({ nullable: true })
    phone : string
    
    @Column({ nullable: true })
    document: string;


    @Column({default : 'person' })
    type: string;

    @Column({ default: 'app_connect' })
    source: string

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    
}