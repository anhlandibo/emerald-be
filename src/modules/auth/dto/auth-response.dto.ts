import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../accounts/enums/user-role.enum';

export class AuthResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ description: 'Access token - expires in 15 minutes' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token - expires in 7 days' })
  refreshToken: string;
}
