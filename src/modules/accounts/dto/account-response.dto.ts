import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

@Exclude()
export class AccountResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the account',
  })
  @Expose()
  id: number;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email of the account',
  })
  @Expose()
  email: string;

  @ApiProperty({
    example: UserRole.RESIDENT,
    description: 'The role of the account',
    enum: UserRole,
  })
  @Expose()
  role: UserRole;

  @ApiProperty({
    example: true,
    description: 'Whether the account is active',
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The creation date of the account',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'The last update date of the account',
  })
  @Expose()
  updatedAt: Date;
}
