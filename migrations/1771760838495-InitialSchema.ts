import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1771760838495 implements MigrationInterface {
    name = 'InitialSchema1771760838495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "accounts" ("id" character varying(255) NOT NULL, "username" character varying(255), "full_name" character varying(500), "description" text, "is_verified" boolean NOT NULL DEFAULT false, "restricted" character varying(100), "internal_id" integer, "status" character varying(100), "id_alt" character varying(255), "type" character varying(50) NOT NULL DEFAULT 'Facebook', CONSTRAINT "PK_5a7a02c20412299d198e097a8fe" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_account_internal_id" ON "accounts" ("internal_id") `);
        await queryRunner.query(`CREATE TABLE "posts" ("id" character varying(255) NOT NULL, "profile_id" character varying(255) NOT NULL, "created_time" TIMESTAMP WITH TIME ZONE NOT NULL, "text_original" text, "comments_count" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_2829ac61eff60fcec60d7274b9e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_post_profile_id" ON "posts" ("profile_id") `);
        await queryRunner.query(`CREATE INDEX "idx_post_created_time" ON "posts" ("created_time") `);
        await queryRunner.query(`CREATE TABLE "follower_sources" ("id" SERIAL NOT NULL, "account_internal_id" integer NOT NULL, "followers_count" integer NOT NULL, CONSTRAINT "PK_55ec8c924484165f0d9d922c91e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_follower_account_internal_id" ON "follower_sources" ("account_internal_id") `);
        await queryRunner.query(`ALTER TABLE "posts" ADD CONSTRAINT "FK_9dbc2524c6f46641f5e7d107da1" FOREIGN KEY ("profile_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT "FK_9dbc2524c6f46641f5e7d107da1"`);
        await queryRunner.query(`DROP INDEX "public"."idx_follower_account_internal_id"`);
        await queryRunner.query(`DROP TABLE "follower_sources"`);
        await queryRunner.query(`DROP INDEX "public"."idx_post_created_time"`);
        await queryRunner.query(`DROP INDEX "public"."idx_post_profile_id"`);
        await queryRunner.query(`DROP TABLE "posts"`);
        await queryRunner.query(`DROP INDEX "public"."idx_account_internal_id"`);
        await queryRunner.query(`DROP TABLE "accounts"`);
    }

}
