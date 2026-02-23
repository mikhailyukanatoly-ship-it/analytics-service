import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Account } from './account.entity';

@Entity('posts')
@Index('idx_post_created_time', ['createdTime'])
export class Post {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string; // Post ID

  @Index('idx_post_profile_id')
  @Column({ type: 'varchar', length: 255, name: 'profile_id' })
  profileId: string;

  @Column({ type: 'timestamp with time zone', name: 'created_time' })
  createdTime: Date;

  @Column({ type: 'text', nullable: true, name: 'text_original' })
  textOriginal: string;

  @Column({ type: 'int', default: 0, name: 'comments_count' })
  commentsCount: number;

  @ManyToOne(() => Account, (account) => account.posts)
  @JoinColumn({ name: 'profile_id', referencedColumnName: 'id' })
  account: Account;
}
