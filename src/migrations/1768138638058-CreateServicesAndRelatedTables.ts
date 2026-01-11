import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateServicesAndRelatedTables1768138638058 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "services" (
                "id" SERIAL NOT NULL,
                "name" character varying NOT NULL,
                "description" text,
                "open_hour" time NOT NULL,
                "close_hour" time NOT NULL,
                "image_url" character varying,
                "unit_price" integer NOT NULL,
                "unit_time_block" integer NOT NULL,
                "total_slot" integer NOT NULL,
                "type" character varying NOT NULL DEFAULT 'NORMAL',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_services" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "slot_availabilities" (
                "id" SERIAL NOT NULL,
                "service_id" integer NOT NULL,
                "start_time" TIMESTAMP NOT NULL,
                "end_time" TIMESTAMP NOT NULL,
                "remaining_slot" integer NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_slot_availabilities" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "slot_availabilities" ADD CONSTRAINT "FK_slot_availabilities_service_id" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            CREATE TABLE "bookings" (
                "id" SERIAL NOT NULL,
                "code" character varying NOT NULL,
                "resident_id" integer NOT NULL,
                "service_id" integer NOT NULL,
                "booking_date" date NOT NULL,
                "timestamps" jsonb NOT NULL,
                "unit_price" integer NOT NULL,
                "total_price" integer NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "expires_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_bookings_code" UNIQUE ("code"),
                CONSTRAINT "PK_bookings" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "booking_payments" (
                "id" SERIAL NOT NULL,
                "booking_id" integer NOT NULL,
                "amount" integer NOT NULL,
                "method" character varying NOT NULL,
                "note" text,
                "paid_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_booking_payments" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            ALTER TABLE "booking_payments" ADD CONSTRAINT "FK_booking_payments_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_resident_id" FOREIGN KEY ("resident_id") REFERENCES "residents"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);

    await queryRunner.query(`
            ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_service_id" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_service_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_resident_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking_payments" DROP CONSTRAINT "FK_booking_payments_booking_id"`,
    );
    await queryRunner.query(`DROP TABLE "booking_payments"`);
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(
      `ALTER TABLE "slot_availabilities" DROP CONSTRAINT "FK_slot_availabilities_service_id"`,
    );
    await queryRunner.query(`DROP TABLE "slot_availabilities"`);
    await queryRunner.query(`DROP TABLE "services"`);
  }
}
