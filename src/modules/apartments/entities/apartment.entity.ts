import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { ApartmentType } from '../enums/apartment-type.enum';
import { Block } from '../../blocks/entities/block.entity';
import { ApartmentResident } from './apartment-resident.entity';

@Entity('apartments')
export class Apartment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'int', nullable: false, name: 'block_id' })
  blockId: number;

  @ManyToOne(() => Block, (block) => block.apartments)
  @JoinColumn({ name: 'block_id' })
  block: Block;

  @Column({ type: 'int', nullable: false })
  floor: number;

  @Column({ type: 'varchar', nullable: false })
  type: ApartmentType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area: number;

  @OneToMany(
    () => ApartmentResident,
    (apartmentResident) => apartmentResident.apartment,
    { cascade: true },
  )
  apartmentResidents: ApartmentResident[];

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
