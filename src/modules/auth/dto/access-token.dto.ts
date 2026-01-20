import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for access token only (after login/refresh)
 * Refresh token is stored in HttpOnly cookie automatically
 */
export class AccessTokenDto {
  @ApiProperty({
    description: 'Access token used for API requests (expires in 15 minutes)',
  })
  accessToken: string;
}
