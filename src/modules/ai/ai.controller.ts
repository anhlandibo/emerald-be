import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UseGuards,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { SummarizeDto } from './dtos/summarize.dto';
import { SummarizeResponseDto } from './dtos/summarize-response.dto';
import { OcrResponseDto } from './dtos/ocr-response.dto';
import { ApiDoc } from 'src/decorators/api-doc.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';

@ApiTags('AI')
@Controller('ai')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summarize')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Tóm tắt file hoặc text thành các sự kiện',
    description:
      'Tóm tắt file (PDF, DOCX, Ảnh, TXT) hoặc text nhập tay thành danh sách sự kiện. Có thể gửi file hoặc text, hoặc cả hai.',
    auth: true,
  })
  @ApiBody({
    description: 'File hoặc text hoặc cả hai',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File tài liệu (PDF, DOCX, JPG, PNG, TXT) - optional',
        },
        text: {
          type: 'string',
          description: 'Nội dung text - optional',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tóm tắt thành công',
    type: SummarizeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Không có file hoặc text để xử lý',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'AI Service không khả dụng',
  })
  async summarize(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: SummarizeDto,
  ): Promise<SummarizeResponseDto> {
    return this.aiService.summarize(file, dto.text);
  }

  @Post('ocr/read-meter')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Đọc chỉ số điện từ ảnh',
    description: 'Upload ảnh chụp bảng điện để hệ thống OCR đọc chỉ số',
    auth: true,
  })
  @ApiBody({
    description: 'File ảnh (jpg, png)',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh điện (jpg, png)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Đọc chỉ số thành công',
    type: OcrResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'File ảnh không hợp lệ',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'AI Service không khả dụng',
  })
  async readMeter(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<OcrResponseDto> {
    return this.aiService.readMeter(file);
  }
}
