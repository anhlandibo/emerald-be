import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDistrictNullable1768314500000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "residents" ALTER COLUMN "district" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "residents" ALTER COLUMN "province" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "residents" ALTER COLUMN "ward" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "residents" ALTER COLUMN "district" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "residents" ALTER COLUMN "province" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "residents" ALTER COLUMN "ward" SET NOT NULL`,
    );
  }
}
