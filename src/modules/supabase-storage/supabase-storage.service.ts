import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SupabaseStorageService {
  private supabaseClient: SupabaseClient;
  private bucket: string;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_KEY');
    this.bucket =
      this.configService.get<string>('SUPABASE_BUCKET') || 'emerald-files';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    this.supabaseClient = createClient(supabaseUrl, supabaseKey);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<string> {
    try {
      const fileExtension = this.getFileExtension(file.originalname);
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const { data, error } = await this.supabaseClient.storage
        .from(this.bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        const errorMsg =
          String((error as unknown as Record<string, unknown>)?.message) ||
          'Unknown error';
        console.error(`Upload error for file ${fileName}:`, error);
        throw new HttpException(
          `Failed to upload file: ${errorMsg}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!data) {
        throw new HttpException(
          'No data returned from upload',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      console.log(`Successfully uploaded file: ${fileName}`);

      // Get signed URL valid for 7 days (works even if bucket is private)
      const { data: signedData, error: signedError } =
        await this.supabaseClient.storage
          .from(this.bucket)
          .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

      if (signedError) {
        const errorMsg =
          String(
            (signedError as unknown as Record<string, unknown>)?.message,
          ) || 'Failed to create signed URL';
        console.warn(`Failed to create signed URL: ${errorMsg}`);
        // Fallback to public URL if signed URL fails
        const { data: publicData } = this.supabaseClient.storage
          .from(this.bucket)
          .getPublicUrl(fileName);
        return publicData?.publicUrl || '';
      }

      const signedUrl = signedData?.signedUrl || '';
      console.log(`Generated signed URL: ${signedUrl}`);
      return signedUrl;
    } catch (error) {
      console.error('Supabase upload error:', error);
      throw new HttpException(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string = 'uploads',
  ): Promise<string[]> {
    try {
      const uploadPromises = files.map((file) => this.uploadFile(file, folder));
      const fileUrls = await Promise.all(uploadPromises);
      return fileUrls;
    } catch (error) {
      console.error('Supabase batch upload error:', error);
      throw new HttpException(
        `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract file path from public URL
      const filePath = this.extractFilePathFromUrl(fileUrl);

      if (!filePath) {
        return;
      }

      const { error } = await this.supabaseClient.storage
        .from(this.bucket)
        .remove([filePath]);

      if (error) {
        const errorMsg =
          String((error as unknown as Record<string, unknown>)?.message) ||
          'Unknown error';
        console.warn(`Failed to delete file ${filePath}: ${errorMsg}`);
        // Don't throw error for delete failures to allow cascade deletion
      }
    } catch (error) {
      console.error('Supabase delete error:', error);
      // Don't throw error for delete failures
    }
  }

  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    try {
      const filePaths = fileUrls
        .map((url) => this.extractFilePathFromUrl(url))
        .filter((path) => path && path.length > 0);

      if (filePaths.length === 0) {
        return;
      }

      const { error } = await this.supabaseClient.storage
        .from(this.bucket)
        .remove(filePaths);

      if (error) {
        const errorMsg =
          String((error as unknown as Record<string, unknown>)?.message) ||
          'Unknown error';
        console.warn(`Failed to delete some files: ${errorMsg}`);
        // Don't throw error for delete failures
      }
    } catch (error) {
      console.error('Supabase batch delete error:', error);
      // Don't throw error for delete failures
    }
  }

  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'bin';
  }

  private extractFilePathFromUrl(url: string): string {
    try {
      // URL format: https://vecvvetadalgxxealhgt.supabase.co/storage/v1/object/public/emerald-files/uploads/uuid.ext
      const parts = url.split(`/${this.bucket}/`);
      if (parts.length > 1) {
        return parts[1];
      }
      return '';
    } catch (error) {
      console.error('Failed to extract file path from URL:', error);
      return '';
    }
  }
}
