import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!' })
  @IsString({ message: 'Old password must be a string' })
  @IsNotEmpty({ message: 'Old password must not be empty' })
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString({ message: 'New password must be a string' })
  @IsNotEmpty({ message: 'New password must not be empty' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số hoặc ký tự đặc biệt',
  })
  newPassword: string;
}
