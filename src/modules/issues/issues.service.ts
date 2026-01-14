import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from './entities/issue.entity';
import { Resident } from '../residents/entities/resident.entity';
import { CreateIssueDto } from './dtos/create-issue.dto';
import { QueryIssueDto } from './dtos/query-issue.dto';
import { RateIssueDto } from './dtos/rate-issue.dto';
import { UpdateIssueDto } from './dtos/update-issue.dto';
import { IssueTypeLabels } from './enums/issue-type.enum';
import { IssueStatus, IssueStatusLabels } from './enums/issue-status.enum';
import { IssueResponseDto } from './dtos/issue-response.dto';

@Injectable()
export class IssuesService {
  constructor(
    @InjectRepository(Issue)
    private readonly issueRepository: Repository<Issue>,
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
  ) {}

  async create(
    createIssueDto: CreateIssueDto,
    accountId: number,
  ): Promise<IssueResponseDto> {
    const resident = await this.residentRepository.findOne({
      where: { accountId, isActive: true },
    });

    if (!resident) {
      throw new HttpException(
        'Resident profile không tìm thấy hoặc không hoạt động',
        HttpStatus.NOT_FOUND,
      );
    }

    const issue = this.issueRepository.create({
      reporterId: resident.id,
      type: createIssueDto.type,
      title: createIssueDto.title,
      description: createIssueDto.description,
      blockId: createIssueDto.blockId,
      floor: createIssueDto.floor,
      detailLocation: createIssueDto.detailLocation,
      fileUrls: createIssueDto.fileUrls || [],
      status: IssueStatus.PENDING,
      isUrgent: false,
      isActive: true,
    });

    const savedIssue = await this.issueRepository.save(issue);
    return this.findOne(savedIssue.id);
  }

  async findAll(query: QueryIssueDto): Promise<IssueResponseDto[]> {
    const { search, status, type, blockId, isUrgent, sortBy, sortOrder } =
      query;

    const queryBuilder = this.issueRepository
      .createQueryBuilder('issue')
      .leftJoinAndSelect('issue.reporter', 'reporter')
      .leftJoinAndSelect('reporter.account', 'account')
      .leftJoinAndSelect('issue.block', 'block')
      .where('issue.isActive = :isActive', { isActive: true });

    if (status) {
      queryBuilder.andWhere('issue.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('issue.type = :type', { type });
    }

    if (blockId) {
      queryBuilder.andWhere('issue.blockId = :blockId', { blockId });
    }

    if (isUrgent !== undefined) {
      queryBuilder.andWhere('issue.isUrgent = :isUrgent', { isUrgent });
    }

    if (search) {
      queryBuilder.andWhere(
        '(issue.title ILIKE :search OR issue.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const orderBy = sortBy || 'createdAt';
    const order = sortOrder || 'DESC';
    queryBuilder.orderBy(`issue.${orderBy}`, order);

    const issues = await queryBuilder.getMany();

    return issues.map((issue) => this.transformToResponse(issue));
  }

  async findOne(id: number): Promise<IssueResponseDto> {
    const issue = await this.issueRepository.findOne({
      where: { id, isActive: true },
      relations: ['reporter', 'reporter.account', 'block'],
    });

    if (!issue) {
      throw new HttpException(
        `Issue với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.transformToResponse(issue);
  }

  async findByResident(residentId: number): Promise<IssueResponseDto[]> {
    const issues = await this.issueRepository.find({
      where: { reporterId: residentId, isActive: true },
      relations: ['reporter', 'reporter.account', 'block'],
      order: { createdAt: 'DESC' },
    });

    return issues.map((issue) => this.transformToResponse(issue));
  }

  async findMyIssues(accountId: number): Promise<IssueResponseDto[]> {
    const resident = await this.residentRepository.findOne({
      where: { accountId, isActive: true },
    });

    if (!resident) {
      throw new HttpException(
        'Resident profile không tìm thấy hoặc không hoạt động',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.findByResident(resident.id);
  }

  async update(
    id: number,
    updateIssueDto: UpdateIssueDto,
  ): Promise<IssueResponseDto> {
    const issue = await this.issueRepository.findOne({
      where: { id, isActive: true },
    });

    if (!issue) {
      throw new HttpException(
        `Issue với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (updateIssueDto.status) {
      this.validateStatusTransition(issue.status, updateIssueDto.status);
    }

    Object.assign(issue, updateIssueDto);

    await this.issueRepository.save(issue);

    return this.findOne(id);
  }

  async rate(
    id: number,
    rateIssueDto: RateIssueDto,
  ): Promise<IssueResponseDto> {
    const issue = await this.issueRepository.findOne({
      where: { id, isActive: true },
    });

    if (!issue) {
      throw new HttpException(
        `Issue với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (issue.status !== IssueStatus.RESOLVED) {
      throw new HttpException(
        'Chỉ có thể đánh giá các vấn đề đã được giải quyết',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (issue.rating) {
      throw new HttpException(
        'Vấn đề đã được đánh giá',
        HttpStatus.BAD_REQUEST,
      );
    }

    issue.rating = rateIssueDto.rating;
    issue.feedback = rateIssueDto.feedback || '';

    await this.issueRepository.save(issue);

    return this.findOne(id);
  }

  async remove(id: number): Promise<{ message: string }> {
    const issue = await this.issueRepository.findOne({
      where: { id, isActive: true },
    });

    if (!issue) {
      throw new HttpException(
        `Issue với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (issue.status !== IssueStatus.PENDING) {
      throw new HttpException(
        'Chỉ có thể xóa các vấn đề vẫn đang chờ xử lý',
        HttpStatus.BAD_REQUEST,
      );
    }

    issue.isActive = false;
    await this.issueRepository.save(issue);

    return { message: 'Issue deleted successfully' };
  }

  private validateStatusTransition(
    currentStatus: IssueStatus,
    newStatus: IssueStatus,
  ): void {
    const validTransitions: Record<IssueStatus, IssueStatus[]> = {
      [IssueStatus.PENDING]: [IssueStatus.RECEIVED],
      [IssueStatus.RECEIVED]: [IssueStatus.PROCESSING, IssueStatus.PENDING],
      [IssueStatus.PROCESSING]: [IssueStatus.RESOLVED, IssueStatus.RECEIVED],
      [IssueStatus.RESOLVED]: [],
    };

    const allowedStatuses = validTransitions[currentStatus];

    if (!allowedStatuses.includes(newStatus)) {
      throw new HttpException(
        `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private transformToResponse(issue: Issue): IssueResponseDto {
    return {
      id: issue.id,
      type: issue.type,
      typeLabel: IssueTypeLabels[issue.type],
      title: issue.title,
      description: issue.description,
      block: issue.block
        ? {
            id: issue.block.id,
            name: issue.block.name,
          }
        : null,
      floor: issue.floor,
      detailLocation: issue.detailLocation,
      fileUrls: issue.fileUrls,
      status: issue.status,
      statusLabel: IssueStatusLabels[issue.status],
      isUrgent: issue.isUrgent,
      rating: issue.rating,
      feedback: issue.feedback,
      reporter: issue.reporter
        ? {
            id: issue.reporter.id,
            fullName: issue.reporter.fullName,
            phoneNumber: issue.reporter.phoneNumber,
          }
        : null,
      estimatedCompletionDate: issue.estimatedCompletionDate,
      // maintenanceTicketId: issue.maintenanceTicketId,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
    };
  }
}
