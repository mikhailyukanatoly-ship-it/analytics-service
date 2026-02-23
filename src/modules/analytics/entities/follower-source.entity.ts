import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';

@Entity('follower_sources')
export class FollowerSource {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_follower_account_internal_id')
  @Column({ type: 'int', name: 'account_internal_id' })
  accountInternalId: number; // Links to accounts.internal_id (_id from CSV)

  @Column({ type: 'int', name: 'followers_count' })
  followersCount: number;
}
