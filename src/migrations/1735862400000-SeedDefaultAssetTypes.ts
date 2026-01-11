import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDefaultAssetTypes1735862400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO asset_types (name, description) VALUES
      ('Camera giám sát', 'Camera an ninh cho hành lang và khu vực chung'),
      ('Thang máy', 'Thang máy chở người và chở hàng'),
      ('Máy phát điện', 'Máy phát điện dự phòng'),
      ('Hệ thống PCCC', 'Phòng cháy chữa cháy - bình cứu hỏa, đầu phun, báo cháy'),
      ('Hệ thống điện nguồn', 'Máy phát điện, Tủ điện tổng'),
      ('Bảng thông tin điện tử', 'Màn hình thông báo, bảng tin tòa nhà'),
      ('Hệ thống cấp thoát nước', 'Máy bơm, bể chứa nước'),
      ('Thiết bị an ninh', 'Cổng từ, hệ thống kiểm soát ra vào')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM asset_types WHERE name IN (
        'Camera giám sát',
        'Thang máy',
        'Máy phát điện',
        'Hệ thống PCCC',
        'Hệ thống điện nguồn',
        'Bảng thông tin điện tử',
        'Hệ thống cấp thoát nước',
        'Thiết bị an ninh'
      )
    `);
  }
}
