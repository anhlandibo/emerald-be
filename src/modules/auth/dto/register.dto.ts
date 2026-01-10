import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'resident@emerald.com' })
  @IsEmail({}, { message: 'Email is invalid' })
  @IsNotEmpty({ message: 'Email must not be empty' })
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password must not be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
