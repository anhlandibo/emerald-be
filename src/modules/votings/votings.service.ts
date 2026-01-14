/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan, LessThan, Between } from 'typeorm';
import { Voting } from './entities/voting.entity';
import { Option } from './entities/option.entity';
import { ResidentOption } from './entities/resident-option.entity';
import { TargetBlock } from '../notifications/entities/target-block.entity';
import { Block } from '../blocks/entities/block.entity';
import { Apartment } from '../apartments/entities/apartment.entity';
import { ApartmentResident } from '../apartments/entities/apartment-resident.entity';
import { Resident } from '../residents/entities/resident.entity';
import { SupabaseStorageService } from '../supabase-storage/supabase-storage.service';
import { CreateVotingDto } from './dto/create-voting.dto';
import { UpdateVotingDto } from './dto/update-voting.dto';
import { QueryVotingDto } from './dto/query-voting.dto';
import { VoteDto } from './dto/vote.dto';
import { DeleteManyVotingsDto } from './dto/delete-many-votings.dto';
import { ScopeType } from '../notifications/enums/scope-type.enum';
import { VotingStatus } from './enums/voting-status.enum';
import { RelationshipType } from '../apartments/enums/relationship-type.enum';
import { Account } from '../accounts/entities/account.entity';

@Injectable()
export class VotingsService {
  constructor(
    @InjectRepository(Voting)
    private readonly votingRepository: Repository<Voting>,
    @InjectRepository(Option)
    private readonly optionRepository: Repository<Option>,
    @InjectRepository(ResidentOption)
    private readonly residentOptionRepository: Repository<ResidentOption>,
    @InjectRepository(TargetBlock)
    private readonly targetBlockRepository: Repository<TargetBlock>,
    @InjectRepository(Block)
    private readonly blockRepository: Repository<Block>,
    @InjectRepository(Apartment)
    private readonly apartmentRepository: Repository<Apartment>,
    @InjectRepository(ApartmentResident)
    private readonly apartmentResidentRepository: Repository<ApartmentResident>,
    @InjectRepository(Resident)
    private readonly residentRepository: Repository<Resident>,
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly supabaseStorageService: SupabaseStorageService,
  ) {}

  private getVotingStatus(voting: Voting): VotingStatus {
    const now = new Date();
    const start = new Date(voting.startTime);
    const end = new Date(voting.endTime);

    if (now < start) {
      return VotingStatus.UPCOMING;
    } else if (now >= start && now <= end) {
      return VotingStatus.ONGOING;
    } else {
      return VotingStatus.ENDED;
    }
  }

  async create(createDto: CreateVotingDto, files?: Express.Multer.File[]) {
    // Validate dates
    const startTime = new Date(createDto.startTime);
    const endTime = new Date(createDto.endTime);

    if (endTime <= startTime) {
      throw new HttpException(
        'Thời gian kết thúc phải sau thời gian bắt đầu',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate options
    if (!createDto.options || createDto.options.length < 2) {
      throw new HttpException(
        'Phải có ít nhất 2 lựa chọn cho cuộc bỏ phiếu',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate target blocks if scope is BLOCK or FLOOR
    if (
      (createDto.targetScope === ScopeType.BLOCK ||
        createDto.targetScope === ScopeType.FLOOR) &&
      (!createDto.targets || createDto.targets.length === 0)
    ) {
      throw new HttpException(
        'Các block là bắt buộc khi phạm vi là BLOCK hoặc FLOOR',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate blocks exist and are active
    if (createDto.targets) {
      const blockIds = createDto.targets.map((t) => t.blockId);
      const blocks = await this.blockRepository.find({
        where: { id: In(blockIds), isActive: true },
      });

      if (blocks.length !== blockIds.length) {
        throw new HttpException(
          'Một hoặc nhiều block không tồn tại hoặc không hoạt động',
          HttpStatus.NOT_FOUND,
        );
      }

      // Validate floor numbers for FLOOR scope
      if (createDto.targetScope === ScopeType.FLOOR) {
        for (const target of createDto.targets) {
          const block = blocks.find((b) => b.id === target.blockId);
          if (!block) {
            throw new HttpException(
              `Block với ID ${target.blockId} không tồn tại`,
              HttpStatus.NOT_FOUND,
            );
          }

          if (
            !target.targetFloorNumbers ||
            target.targetFloorNumbers.length === 0
          ) {
            throw new HttpException(
              `Các số tầng mục tiêu là bắt buộc cho block ${block.name} khi phạm vi là FLOOR`,
              HttpStatus.BAD_REQUEST,
            );
          }

          if (block.totalFloors) {
            const invalidFloors = target.targetFloorNumbers.filter(
              (floor) => floor < 0 || floor > block.totalFloors,
            );
            if (invalidFloors.length > 0) {
              throw new HttpException(
                `Các số tầng không hợp lệ [${invalidFloors.join(', ')}] cho block ${block.name}. Phạm vi hợp lệ: 0-${block.totalFloors}`,
                HttpStatus.BAD_REQUEST,
              );
            }
          }
        }
      }
    }

    // Upload files to Supabase if provided
    let fileUrls: string[] | null = null;
    if (files && files.length > 0) {
      try {
        fileUrls = await this.supabaseStorageService.uploadMultipleFiles(
          files,
          'votings',
        );
      } catch (error) {
        console.error('Supabase upload error:', error);
        throw new HttpException(
          `Không thể tải lên tệp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // Create voting
    const voting = this.votingRepository.create({
      title: createDto.title,
      content: createDto.content,
      targetScope: createDto.targetScope,
      isRequired: createDto.isRequired ?? false,
      startTime: startTime,
      endTime: endTime,
      fileUrls: fileUrls,
    });

    const savedVoting = await this.votingRepository.save(voting);

    // Create options
    const options = createDto.options.map((opt) =>
      this.optionRepository.create({
        votingId: savedVoting.id,
        name: opt.name,
        description: opt.description,
      }),
    );

    await this.optionRepository.save(options);

    // Create target blocks if provided
    if (createDto.targets && createDto.targets.length > 0) {
      const targetBlocks = createDto.targets.map((target) =>
        this.targetBlockRepository.create({
          votingId: savedVoting.id,
          blockId: target.blockId,
          targetFloorNumbers: target.targetFloorNumbers || undefined,
        }),
      );

      await this.targetBlockRepository.save(targetBlocks);
    }

    // Return full voting with relations
    return this.findOne(savedVoting.id);
  }

  async findAll(queryDto: QueryVotingDto) {
    const { search, targetScope, status, isRequired } = queryDto;

    const queryBuilder = this.votingRepository
      .createQueryBuilder('voting')
      .leftJoinAndSelect('voting.options', 'options')
      .andWhere('voting.isActive = :isActive', { isActive: true });

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(voting.title LIKE :search OR voting.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (targetScope) {
      queryBuilder.andWhere('voting.targetScope = :targetScope', {
        targetScope,
      });
    }

    if (isRequired !== undefined) {
      queryBuilder.andWhere('voting.isRequired = :isRequired', { isRequired });
    }

    // Filter by status if provided
    const now = new Date();
    if (status === VotingStatus.UPCOMING) {
      queryBuilder.andWhere('voting.startTime > :now', { now });
    } else if (status === VotingStatus.ONGOING) {
      queryBuilder.andWhere('voting.startTime <= :now', { now });
      queryBuilder.andWhere('voting.endTime >= :now', { now });
    } else if (status === VotingStatus.ENDED) {
      queryBuilder.andWhere('voting.endTime < :now', { now });
    }

    queryBuilder.orderBy('voting.startTime', 'DESC');

    const votings = await queryBuilder.getMany();

    // Format response with computed fields
    const result = await Promise.all(
      votings.map(async (voting) => {
        const voteStatus = this.getVotingStatus(voting);
        const leadingOption = await this.getLeadingOption(voting.id);
        const scopeDisplay = await this.getScopeDisplay(voting.id);

        return {
          id: voting.id,
          title: voting.title,
          scopeDisplay,
          startTime: voting.startTime,
          isRequired: voting.isRequired,
          status: voteStatus,
          leadingOption: leadingOption || null,
        };
      }),
    );

    return result;
  }

  async findOne(id: number) {
    const voting = await this.votingRepository.findOne({
      where: { id, isActive: true },
      relations: ['options'],
    });

    if (!voting) {
      throw new HttpException(
        `Không tìm thấy cuộc bỏ phiếu với ID ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Get target blocks
    const targetBlocks = await this.targetBlockRepository.find({
      where: { votingId: id },
      relations: ['block'],
    });

    return {
      ...voting,
      status: this.getVotingStatus(voting),
      targetBlocks: targetBlocks.map((tb) => ({
        blockId: tb.blockId,
        blockName: tb.block?.name,
        targetFloorNumbers: tb.targetFloorNumbers,
      })),
    };
  }

  async update(
    id: number,
    updateDto: UpdateVotingDto,
    files?: Express.Multer.File[],
  ) {
    const voting = await this.votingRepository.findOne({
      where: { id, isActive: true },
      relations: ['options'],
    });

    if (!voting) {
      throw new HttpException(
        `Voting với ID ${id} không tồn tại`,
        HttpStatus.NOT_FOUND,
      );
    }

    const status = this.getVotingStatus(voting);

    // Validate update permissions based on status
    if (status === VotingStatus.ENDED) {
      throw new HttpException(
        'Không thể cập nhật voting đã kết thúc',
        HttpStatus.BAD_REQUEST,
      );
    }

    // If ONGOING, only allow text/file updates, not options
    if (status === VotingStatus.ONGOING) {
      if (updateDto.options || updateDto.targets) {
        throw new HttpException(
          'Không thể cập nhật các tùy chọn hoặc mục tiêu cho voting đang diễn ra',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate dates if provided
    if (updateDto.startTime && updateDto.endTime) {
      const newStart = new Date(updateDto.startTime);
      const newEnd = new Date(updateDto.endTime);

      if (newEnd <= newStart) {
        throw new HttpException(
          'Thời gian kết thúc phải sau thời gian bắt đầu',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Upload new files if provided
    if (files && files.length > 0) {
      try {
        const newFileUrls =
          await this.supabaseStorageService.uploadMultipleFiles(
            files,
            'votings',
          );

        voting.fileUrls = [
          ...(Array.isArray(voting.fileUrls) ? voting.fileUrls : []),
          ...newFileUrls,
        ];
      } catch (error) {
        console.error('Supabase upload error:', error);
        throw new HttpException(
          `Không thể tải lên tệp: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }

    // Update voting fields
    Object.assign(voting, {
      title: updateDto.title ?? voting.title,
      content: updateDto.content ?? voting.content,
      isRequired: updateDto.isRequired ?? voting.isRequired,
      startTime: updateDto.startTime
        ? new Date(updateDto.startTime)
        : voting.startTime,
      endTime: updateDto.endTime ? new Date(updateDto.endTime) : voting.endTime,
      targetScope: updateDto.targetScope ?? voting.targetScope,
    });

    await this.votingRepository.save(voting);

    // Update options if UPCOMING
    if (status === VotingStatus.UPCOMING && updateDto.options) {
      // Delete existing options
      await this.optionRepository.delete({ votingId: id });

      // Create new options
      const options = updateDto.options.map((opt) =>
        this.optionRepository.create({
          votingId: id,
          name: opt.name,
          description: opt.description,
        }),
      );

      await this.optionRepository.save(options);
    }

    // Update target blocks if provided and UPCOMING
    if (status === VotingStatus.UPCOMING && updateDto.targets) {
      // Delete existing target blocks
      await this.targetBlockRepository.delete({ votingId: id });

      // Create new target blocks
      const targetBlocks = updateDto.targets.map((target) =>
        this.targetBlockRepository.create({
          votingId: id,
          blockId: target.blockId,
          targetFloorNumbers: target.targetFloorNumbers || undefined,
        }),
      );

      await this.targetBlockRepository.save(targetBlocks);
    }

    return this.findOne(id);
  }

  async remove(id: number) {
    const voting = await this.findOne(id);

    // Delete files from Supabase Storage if they exist
    if (voting.fileUrls && voting.fileUrls.length > 0) {
      try {
        await this.supabaseStorageService.deleteMultipleFiles(voting.fileUrls);
      } catch (error) {
        console.error('Failed to delete some files from Supabase:', error);
      }
    }

    // Soft delete
    await this.votingRepository.update(id, { isActive: false });

    return { message: 'Voting deleted successfully' };
  }

  async removeMany(deleteDto: DeleteManyVotingsDto) {
    const { ids } = deleteDto;

    if (!ids || ids.length === 0) {
      throw new HttpException(
        'IDs list không thể trống',
        HttpStatus.BAD_REQUEST,
      );
    }

    const votings = await this.votingRepository.find({
      where: { id: In(ids), isActive: true },
    });

    if (votings.length === 0) {
      throw new HttpException(
        'Không tìm thấy cuộc bỏ phiếu nào với các ID đã cung cấp',
        HttpStatus.NOT_FOUND,
      );
    }

    // Collect all file URLs
    const allFileUrls = votings.flatMap((v) => v.fileUrls || []);

    // Delete files from Supabase
    if (allFileUrls.length > 0) {
      try {
        await this.supabaseStorageService.deleteMultipleFiles(allFileUrls);
      } catch (error) {
        console.error('Failed to delete some files from Supabase:', error);
      }
    }

    // Soft delete
    await this.votingRepository.update({ id: In(ids) }, { isActive: false });

    return {
      message: `Successfully deleted ${votings.length} voting(s)`,
      deletedCount: votings.length,
    };
  }

  async vote(accountId: number, votingId: number, voteDto: VoteDto) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, isActive: true },
    });
    if (!account)
      throw new HttpException('Tài khoản không tồn tại', HttpStatus.NOT_FOUND);
    // Validate resident exists
    const resident = await this.residentRepository.findOne({
      where: { accountId: account.id, isActive: true },
    });
    console.log(accountId, resident);
    if (!resident)
      throw new HttpException('Cư dân không tồn tại', HttpStatus.NOT_FOUND);
    // Validate voting exists
    const voting = await this.votingRepository.findOne({
      where: { id: votingId, isActive: true },
    });

    if (!voting) {
      throw new HttpException(
        'Cuộc bỏ phiếu không tồn tại',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check voting status
    const status = this.getVotingStatus(voting);
    if (status !== VotingStatus.ONGOING) {
      throw new HttpException(
        'Cuộc bỏ phiếu hiện chưa hoạt động',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate option exists
    const option = await this.optionRepository.findOne({
      where: { id: voteDto.optionId, votingId },
    });

    if (!option) {
      throw new HttpException(
        'Lựa chọn không tồn tại cho cuộc bỏ phiếu này',
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if resident already voted
    const existingVote = await this.residentOptionRepository.findOne({
      where: {
        residentId: resident.id,
        option: { votingId },
      },
      relations: ['option'],
    });

    if (existingVote) {
      // Update existing vote
      existingVote.optionId = voteDto.optionId;
      await this.residentOptionRepository.save(existingVote);
    } else {
      // Create new vote
      const residentOption = this.residentOptionRepository.create({
        residentId: resident.id,
        optionId: voteDto.optionId,
      });
      await this.residentOptionRepository.save(residentOption);
    }

    return { message: 'Vote recorded successfully' };
  }

  async findMyVotings(accountId: number, queryDto: QueryVotingDto) {
    const account = await this.accountRepository.findOne({
      where: { id: accountId, isActive: true },
    });
    if (!account)
      throw new HttpException('Tài khoản không tồn tại', HttpStatus.NOT_FOUND);

    // Validate resident exists
    const resident = await this.residentRepository.findOne({
      where: { accountId: account.id, isActive: true },
    });
    if (!resident)
      throw new HttpException('Cư dân không tồn tại', HttpStatus.NOT_FOUND);

    // Get resident's apartment information to determine voting eligibility
    const apartmentResidents = await this.apartmentResidentRepository.find({
      where: { residentId: resident.id },
      relations: ['apartment', 'apartment.block'],
    });

    if (apartmentResidents.length === 0) {
      return []; // No apartment = no votings
    }

    const { search, targetScope, status, isRequired } = queryDto;

    // Build query
    const queryBuilder = this.votingRepository
      .createQueryBuilder('voting')
      .leftJoinAndSelect('voting.options', 'options')
      .andWhere('voting.isActive = :isActive', { isActive: true });

    // Apply basic filters
    if (search) {
      queryBuilder.andWhere(
        '(voting.title LIKE :search OR voting.content LIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (targetScope) {
      queryBuilder.andWhere('voting.targetScope = :targetScope', {
        targetScope,
      });
    }

    if (isRequired !== undefined) {
      queryBuilder.andWhere('voting.isRequired = :isRequired', { isRequired });
    }

    // Filter by status
    const now = new Date();
    if (status === VotingStatus.UPCOMING) {
      queryBuilder.andWhere('voting.startTime > :now', { now });
    } else if (status === VotingStatus.ONGOING) {
      queryBuilder.andWhere('voting.startTime <= :now', { now });
      queryBuilder.andWhere('voting.endTime >= :now', { now });
    } else if (status === VotingStatus.ENDED) {
      queryBuilder.andWhere('voting.endTime < :now', { now });
    }

    queryBuilder.orderBy('voting.startTime', 'DESC');

    const allVotings = await queryBuilder.getMany();

    // Filter votings that apply to resident's apartments
    const eligibleVotings = await Promise.all(
      allVotings.map(async (voting) => {
        const isEligible = await this.isResidentEligibleForVoting(
          resident.id,
          voting.id,
          apartmentResidents,
        );
        return isEligible ? voting : null;
      }),
    );

    const filteredVotings = eligibleVotings.filter(
      (v): v is Voting => v !== null,
    );

    // Format response with voting area and voted option
    const result = await Promise.all(
      filteredVotings.map(async (voting) => {
        const votingArea = await this.getResidentVotingArea(resident.id);
        const votedOption = await this.getResidentVotedOption(
          resident.id,
          voting.id,
        );

        return {
          id: voting.id,
          title: voting.title,
          content: voting.content,
          startTime: voting.startTime,
          endTime: voting.endTime,
          isRequired: voting.isRequired,
          status: this.getVotingStatus(voting),
          votingArea,
          votedOption: votedOption || null,
          options: voting.options.map((opt) => ({
            id: opt.id,
            name: opt.name,
            description: opt.description,
          })),
        };
      }),
    );

    return result;
  }

  async getStatistics(votingId: number) {
    const voting = await this.votingRepository.findOne({
      where: { id: votingId, isActive: true },
      relations: ['options'],
    });

    if (!voting) {
      throw new HttpException('Voting không tồn tại', HttpStatus.NOT_FOUND);
    }

    // Get total eligible area for this voting
    const totalEligibleArea = await this.getTotalEligibleArea(votingId);

    // Calculate results for each option
    const optionResults = await Promise.all(
      voting.options.map(async (option) => {
        const totalArea = await this.calculateOptionArea(option.id);
        const voteCount = await this.residentOptionRepository.count({
          where: { optionId: option.id },
        });
        const percentage =
          totalEligibleArea > 0
            ? Number(((totalArea / totalEligibleArea) * 100).toFixed(2))
            : 0;

        return {
          optionId: option.id,
          optionName: option.name,
          totalArea,
          voteCount,
          percentage,
        };
      }),
    );

    // Sort by totalArea descending
    optionResults.sort((a, b) => b.totalArea - a.totalArea);

    // Calculate participation
    const votedResidentIds = await this.residentOptionRepository
      .createQueryBuilder('ro')
      .select('DISTINCT ro.residentId', 'residentId')
      .innerJoin('ro.option', 'option')
      .where('option.votingId = :votingId', { votingId })
      .getRawMany();

    const votedArea = await this.calculateTotalAreaForResidents(
      votedResidentIds.map((r) => r.residentId),
    );

    const participationRate =
      totalEligibleArea > 0
        ? Number(((votedArea / totalEligibleArea) * 100).toFixed(2))
        : 0;

    return {
      votingId,
      votingTitle: voting.title,
      status: this.getVotingStatus(voting),
      totalEligibleArea,
      votedArea,
      participationRate,
      results: optionResults,
    };
  }

  private async isResidentEligibleForVoting(
    residentId: number,
    votingId: number,
    apartmentResidents: ApartmentResident[],
  ): Promise<boolean> {
    const voting = await this.votingRepository.findOne({
      where: { id: votingId },
    });

    if (!voting) return false;

    // If scope is ALL, everyone is eligible
    if (voting.targetScope === ScopeType.ALL) return true;

    // Get target blocks for this voting
    const targetBlocks = await this.targetBlockRepository.find({
      where: { votingId },
    });

    if (targetBlocks.length === 0) return false;

    // Check if resident's apartments match target blocks
    for (const ar of apartmentResidents) {
      const apartment = ar.apartment;
      if (!apartment) continue;

      for (const tb of targetBlocks) {
        if (voting.targetScope === ScopeType.BLOCK) {
          if (apartment.blockId === tb.blockId) return true;
        } else if (voting.targetScope === ScopeType.FLOOR) {
          if (
            apartment.blockId === tb.blockId &&
            tb.targetFloorNumbers &&
            tb.targetFloorNumbers.includes(apartment.floor)
          ) {
            return true;
          }
        }
      }
    }

    return false;
  }

  private async getResidentVotingArea(residentId: number): Promise<number> {
    const apartmentResidents = await this.apartmentResidentRepository.find({
      where: {
        residentId,
        relationship: RelationshipType.OWNER,
      },
      relations: ['apartment'],
    });

    const totalArea = apartmentResidents.reduce((sum, ar) => {
      return sum + (Number(ar.apartment?.area) || 0);
    }, 0);

    return Number(totalArea.toFixed(2));
  }

  private async getResidentVotedOption(
    residentId: number,
    votingId: number,
  ): Promise<{ id: number; name: string } | null> {
    const residentOption = await this.residentOptionRepository.findOne({
      where: {
        residentId,
        option: { votingId },
      },
      relations: ['option'],
    });

    if (!residentOption || !residentOption.option) return null;

    return {
      id: residentOption.option.id,
      name: residentOption.option.name,
    };
  }

  private async getTotalEligibleArea(votingId: number): Promise<number> {
    const voting = await this.votingRepository.findOne({
      where: { id: votingId },
    });

    if (!voting) return 0;

    // If ALL scope, get all apartments
    if (voting.targetScope === ScopeType.ALL) {
      const result = await this.apartmentRepository
        .createQueryBuilder('apartment')
        .select('SUM(apartment.area)', 'totalArea')
        .where('apartment.isActive = :isActive', { isActive: true })
        .getRawOne();

      return Number(result?.totalArea || 0);
    }

    // Get target blocks
    const targetBlocks = await this.targetBlockRepository.find({
      where: { votingId },
    });

    if (targetBlocks.length === 0) return 0;

    let totalArea = 0;

    for (const tb of targetBlocks) {
      if (voting.targetScope === ScopeType.BLOCK) {
        // Sum all apartments in this block
        const result = await this.apartmentRepository
          .createQueryBuilder('apartment')
          .select('SUM(apartment.area)', 'totalArea')
          .where('apartment.blockId = :blockId', { blockId: tb.blockId })
          .andWhere('apartment.isActive = :isActive', { isActive: true })
          .getRawOne();

        totalArea += Number(result?.totalArea || 0);
      } else if (voting.targetScope === ScopeType.FLOOR) {
        // Sum apartments on specific floors
        if (tb.targetFloorNumbers && tb.targetFloorNumbers.length > 0) {
          const result = await this.apartmentRepository
            .createQueryBuilder('apartment')
            .select('SUM(apartment.area)', 'totalArea')
            .where('apartment.blockId = :blockId', { blockId: tb.blockId })
            .andWhere('apartment.floorNumber IN (:...floors)', {
              floors: tb.targetFloorNumbers,
            })
            .andWhere('apartment.isActive = :isActive', { isActive: true })
            .getRawOne();

          totalArea += Number(result?.totalArea || 0);
        }
      }
    }

    return Number(totalArea.toFixed(2));
  }

  private async calculateTotalAreaForResidents(
    residentIds: number[],
  ): Promise<number> {
    if (residentIds.length === 0) return 0;

    const apartmentResidents = await this.apartmentResidentRepository.find({
      where: {
        residentId: In(residentIds),
        relationship: RelationshipType.OWNER,
      },
      relations: ['apartment'],
    });

    const totalArea = apartmentResidents.reduce((sum, ar) => {
      return sum + (Number(ar.apartment?.area) || 0);
    }, 0);

    return Number(totalArea.toFixed(2));
  }

  private async getLeadingOption(votingId: number): Promise<string | null> {
    const options = await this.optionRepository.find({ where: { votingId } });

    if (options.length === 0) return null;

    // Calculate area-based votes for each option
    const results = await Promise.all(
      options.map(async (option) => {
        const totalArea = await this.calculateOptionArea(option.id);
        return { name: option.name, area: totalArea };
      }),
    );

    // Find option with highest area
    const leading = results.reduce((max, current) =>
      current.area > max.area ? current : max,
    );

    return leading.area > 0 ? leading.name : null;
  }

  private async calculateOptionArea(optionId: number): Promise<number> {
    const residentOptions = await this.residentOptionRepository.find({
      where: { optionId },
    });

    if (residentOptions.length === 0) return 0;

    const residentIds = residentOptions.map((ro) => ro.residentId);

    // Get apartments where these residents are OWNERS
    const apartmentResidents = await this.apartmentResidentRepository.find({
      where: {
        residentId: In(residentIds),
        relationship: RelationshipType.OWNER,
      },
      relations: ['apartment'],
    });

    const totalArea = apartmentResidents.reduce((sum, ar) => {
      return sum + (Number(ar.apartment?.area) || 0);
    }, 0);

    return totalArea;
  }

  private async getScopeDisplay(votingId: number): Promise<string> {
    const voting = await this.votingRepository.findOne({
      where: { id: votingId },
    });

    if (!voting) return '';

    if (voting.targetScope === ScopeType.ALL) {
      return 'Toàn bộ chung cư';
    }

    const targetBlocks = await this.targetBlockRepository.find({
      where: { votingId },
      relations: ['block'],
    });

    if (targetBlocks.length === 0) return '';

    const displays = targetBlocks.map((tb) => {
      if (
        voting.targetScope === ScopeType.FLOOR &&
        tb.targetFloorNumbers &&
        tb.targetFloorNumbers.length > 0
      ) {
        return `${tb.block?.name} - Tầng ${tb.targetFloorNumbers.join(', ')}`;
      }
      return tb.block?.name || '';
    });

    return displays.join(', ');
  }
}
