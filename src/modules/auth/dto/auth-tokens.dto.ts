import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ description: 'Access token used for API requests' })
  accessToken: string;

  @ApiProperty({ description: 'Refresh token used to obtain a new access token' })
  refreshToken: string;
}
