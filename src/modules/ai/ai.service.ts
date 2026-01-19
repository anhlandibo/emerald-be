import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { SummarizeResponseDto } from './dtos/summarize-response.dto';
import { OcrResponseDto } from './dtos/ocr-response.dto';
import { CCCDResponseDto } from './dtos/cccd-response.dto';

@Injectable()
export class AiService {
  private aiServiceUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.aiServiceUrl = this.configService.get<string>(
      'AI_SERVICE_URL',
      'http://localhost:8000',
    );
  }

  async summarize(
    file?: Express.Multer.File,
    text?: string,
  ): Promise<SummarizeResponseDto> {
    try {
      if (!file && !text) {
        throw new HttpException(
          'Vui lòng cung cấp file hoặc text để tóm tắt',
          HttpStatus.BAD_REQUEST,
        );
      }

      const formData = new FormData();

      if (file) {
        const blob = new Blob([new Uint8Array(file.buffer)], {
          type: file.mimetype,
        });
        formData.append('file', blob, file.originalname);
      }

      if (text) {
        formData.append('text', text);
      }

      const response = await firstValueFrom(
        this.httpService.post<SummarizeResponseDto>(
          `${this.aiServiceUrl}/api/v1/ai/summarize`,
          formData,
        ),
      );

      return response.data;
    } catch (error) {
      return this.handleAiServiceError(error);
    }
  }

  async readMeter(file: Express.Multer.File): Promise<OcrResponseDto> {
    try {
      if (!file) {
        throw new HttpException(
          'Vui lòng upload file ảnh',
          HttpStatus.BAD_REQUEST,
        );
      }

      const normalizedMimetype = file.mimetype?.toLowerCase() || '';
      const validMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

      console.log('[OCR] File validation:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        normalized: normalizedMimetype,
        isValid: validMimeTypes.includes(normalizedMimetype),
      });

      if (!validMimeTypes.includes(normalizedMimetype)) {
        throw new HttpException(
          `Chỉ chấp nhận file ảnh (jpg, png). Nhận được: ${file.mimetype}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const formData = new FormData();
      const blob = new Blob([new Uint8Array(file.buffer)], {
        type: file.mimetype,
      });
      formData.append('file', blob, file.originalname);

      const response = await firstValueFrom(
        this.httpService.post<OcrResponseDto>(
          `${this.aiServiceUrl}/api/v1/ocr/read-meter`,
          formData,
        ),
      );

      return response.data;
    } catch (error) {
      return this.handleAiServiceError(error);
    }
  }

  async readCccdImage(file: Express.Multer.File): Promise<CCCDResponseDto> {
    // Validate file
    if (!file) {
      throw new HttpException(
        'Vui lòng tải lên ảnh CCCD',
        HttpStatus.BAD_REQUEST,
      );
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new HttpException(
        'Chỉ chấp nhận file ảnh (jpg, png). Vui lòng kiểm tra lại định dạng file.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (file.size === 0) {
      throw new HttpException(
        'File ảnh rỗng hoặc bị lỗi',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Prepare FormData to send to Python API
      const formData = new FormData();
      const blob = new Blob([Buffer.from(file.buffer)], {
        type: file.mimetype,
      });
      formData.append('file', blob, file.originalname);

      console.log(
        `[CCCD Service] Sending image to Python API: ${this.aiServiceUrl}/api/v1/ocr/read-cccd`,
      );

      // Call Python API endpoint
      const response = await firstValueFrom(
        this.httpService.post<CCCDResponseDto>(
          `${this.aiServiceUrl}/api/v1/ocr/read-cccd`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30 second timeout for YOLO + OCR + LLM processing
          },
        ),
      );

      return response.data;
    } catch (error) {
      console.error('[CCCD Service] Error calling Python API:', error);

      if (error.response) {
        // Python API returned error response
        const pythonError = error.response.data;
        throw new HttpException(
          pythonError.detail ||
            'Không thể xử lý ảnh CCCD. Vui lòng kiểm tra chất lượng ảnh.',
          error.response.status || HttpStatus.BAD_REQUEST,
        );
      } else if (error.code === 'ECONNREFUSED') {
        // Python API not running
        throw new HttpException(
          'Dịch vụ CCCD OCR hiện không khả dụng. Vui lòng thử lại sau.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      } else {
        // Other errors
        throw new HttpException(
          'Lỗi server khi xử lý CCCD: ' + (error.message || 'Unknown error'),
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  private handleAiServiceError(error: any): never {
    if (error.response) {
      // AI Service trả về error response
      throw new HttpException(
        error.response.data?.detail || 'Lỗi từ AI Service khi xử lý yêu cầu',
        error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else if (error.message) {
      // Network error hoặc axios error
      if (
        error.message.includes('ECONNREFUSED') ||
        error.message.includes('ENOTFOUND')
      ) {
        throw new HttpException(
          'Không thể kết nối tới AI Service. Vui lòng kiểm tra kết nối.',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      throw new HttpException(
        error.message || 'Lỗi không xác định từ AI Service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } else {
      throw new HttpException(
        'Lỗi không xác định khi gọi AI Service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
