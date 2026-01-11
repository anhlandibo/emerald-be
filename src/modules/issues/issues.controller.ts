import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseIntPipe,
  UseGuards,
  UploadedFiles,
} from '@nestjs/common';
import { ApiTags, ApiResponse, ApiParam, ApiConsumes } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IssuesService } from './issues.service';
import { CreateIssueDto } from './dtos/create-issue.dto';
import { UpdateIssueDto } from './dtos/update-issue.dto';
import { QueryIssueDto } from './dtos/query-issue.dto';
import { RateIssueDto } from './dtos/rate-issue.dto';
import { IssueResponseDto } from './dtos/issue-response.dto';
import { TransformInterceptor } from 'src/interceptors/transform.interceptor';
import { ApiDoc } from 'src/decorators/api-doc.decorator';
import { AuthGuard } from 'src/guards/auth.guard';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CurrentUser } from 'src/decorators/user.decorator';
import { UploadApiResponse } from 'cloudinary';

@ApiTags('Issues')
@Controller('issues')
@UseInterceptors(ClassSerializerInterceptor, TransformInterceptor)
export class IssuesController {
  constructor(
    private readonly issuesService: IssuesService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FilesInterceptor('files', 5))
  @ApiConsumes('multipart/form-data')
  @ApiDoc({
    summary: 'Cư dân tạo 1 phản ánh mới',
    description:
      'Tạo phản ánh về các vấn đề trong chung cư. Có thể upload tối đa 5 ảnh.',
    auth: true,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Issue created successfully',
    type: IssueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async create(
    @CurrentUser('id') accountId: number,
    @Body() createIssueDto: CreateIssueDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<IssueResponseDto> {
    let fileUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        this.cloudinaryService.uploadFile(file),
      );
      const uploadResults = await Promise.all(uploadPromises);
      fileUrls = uploadResults
        .filter((result): result is UploadApiResponse => {
          return !!result && 'secure_url' in result;
        })
        .map((result) => result.secure_url);
    }

    return this.issuesService.create(
      {
        ...createIssueDto,
        fileUrls,
      },
      accountId,
    );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Lấy danh sách tất cả phản ánh',
    description: 'Lấy danh sách phản ánh với các bộ lọc',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of issues retrieved successfully',
    type: [IssueResponseDto],
  })
  async findAll(
    @Query() queryIssueDto: QueryIssueDto,
  ): Promise<IssueResponseDto[]> {
    return this.issuesService.findAll(queryIssueDto);
  }

  @Get('mine')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Danh sách phản ánh của tôi',
    description: 'Lấy danh sách tất cả phản ánh của cư dân hiện tại',
    auth: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User issues retrieved successfully',
    type: [IssueResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async findMine(
    @CurrentUser('id') accountId: number,
  ): Promise<IssueResponseDto[]> {
    return this.issuesService.findMyIssues(accountId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Xem chi tiết 1 phản ánh',
    description: 'Lấy thông tin chi tiết của phản ánh theo ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Issue ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue details retrieved successfully',
    type: IssueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IssueResponseDto> {
    return this.issuesService.findOne(id);
  }

  @Get('resident/:residentId')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Xem phản ánh của 1 cư dân',
    description: 'Lấy danh sách phản ánh của cư dân theo resident ID',
  })
  @ApiParam({
    name: 'residentId',
    description: 'Resident ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Resident issues retrieved successfully',
    type: [IssueResponseDto],
  })
  async findByResident(
    @Param('residentId', ParseIntPipe) residentId: number,
  ): Promise<IssueResponseDto[]> {
    return this.issuesService.findByResident(residentId);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Cập nhật phản ánh (BQL/Admin)',
    description:
      'BQL/Admin cập nhật trạng thái, đánh dấu khẩn cấp, thời gian dự kiến...',
  })
  @ApiParam({
    name: 'id',
    description: 'Issue ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue updated successfully',
    type: IssueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid status transition',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateIssueDto: UpdateIssueDto,
  ): Promise<IssueResponseDto> {
    return this.issuesService.update(id, updateIssueDto);
  }

  @Post(':id/rate')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Đánh giá việc xử lý phản ánh',
    description: 'Cư dân đánh giá sau khi phản ánh được giải quyết',
    auth: true,
  })
  @ApiParam({
    name: 'id',
    description: 'Issue ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue rated successfully',
    type: IssueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Issue not resolved yet or already rated',
  })
  async rate(
    @Param('id', ParseIntPipe) id: number,
    @Body() rateIssueDto: RateIssueDto,
  ): Promise<IssueResponseDto> {
    return this.issuesService.rate(id, rateIssueDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiDoc({
    summary: 'Cư dân xóa phản ánh (khi chưa dc tiếp nhận)',
    description: 'Soft delete phản ánh - chỉ được xóa khi status còn PENDING',
    auth: true,
  })
  @ApiParam({
    name: 'id',
    description: 'Issue ID',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Issue deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Issue not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Can only delete pending issues',
  })
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.issuesService.remove(id);
  }
}
