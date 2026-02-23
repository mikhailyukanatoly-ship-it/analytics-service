import { Entity, Column, PrimaryColumn, OneToMany, Index } from 'typeorm';
import { Post } from './post.entity';

@Entity('accounts')
export class Account {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string; // Facebook profile ID

  @Column({ type: 'varchar', length: 255, nullable: true })
  username: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'full_name' })
  fullName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false, name: 'is_verified' })
  isVerified: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  restricted: string;

  @Index('idx_account_internal_id')
  @Column({ type: 'int', nullable: true, name: 'internal_id' })
  internalId: number; // _id from CSV

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'status' })
  status: string; // _status from CSV

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'id_alt' })
  idAlt: string;

  @Column({ type: 'varchar', length: 50, default: 'Facebook' })
  type: string;

  @OneToMany(() => Post, (post) => post.account)
  posts: Post[];
}
