import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!' })
  @IsString({ message: 'Old password must be a string' })
  @IsNotEmpty({ message: 'Old password must not be empty' })
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password must not be empty' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  newPassword: string;
}
