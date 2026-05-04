import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BackupStorageService {
  private readonly logger = new Logger(BackupStorageService.name);
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;
  private readonly folder = 'backups';

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('SUPABASE_URL');
    const key = this.config.get<string>('SUPABASE_KEY');
    this.bucket = this.config.get<string>('SUPABASE_BUCKET') || 'emerald-files';

    if (!url || !key) throw new Error('Missing Supabase config');

    // ✅ Dùng service_role key nếu có, fallback về anon key
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.supabase = createClient(url, serviceKey || key);
  }

  /**
   * Upload file backup — chỉ trả về storagePath, KHÔNG tạo URL
   */
  async uploadBackup(buffer: Buffer, fileName: string): Promise<string> {
    const storagePath = `${this.folder}/${fileName}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(storagePath, buffer, {
        contentType: 'application/sql',
        upsert: false,
      });

    if (error) {
      throw new HttpException(
        `Backup upload failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.log(`Uploaded backup: ${storagePath}`);
    return storagePath; // 'backups/backup-2024-01-01-id5.sql'
  }

  /**
   * Tạo signed URL on-demand — mặc định 5 phút
   * Không lưu vào DB, chỉ dùng tại thời điểm cần
   */
  async createSignedUrl(
    storagePath: string,
    expiresInSeconds = 300,
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, expiresInSeconds);

    if (error || !data) {
      throw new HttpException(
        `Cannot create signed URL: ${error?.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return data.signedUrl;
  }

  /**
   * Download file về buffer — dùng nội bộ cho verify + restore
   * File KHÔNG đi qua client
   */
  async downloadBackup(storagePath: string): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .download(storagePath);

    if (error || !data) {
      throw new HttpException(
        `Cannot download backup: ${error?.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return Buffer.from(await data.arrayBuffer());
  }
}
