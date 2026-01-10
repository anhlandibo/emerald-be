import { applyDecorators } from '@nestjs/common';
import {
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

interface ApiDocOptions {
  summary: string;
  description?: string;
  auth?: boolean;
  paginated?: boolean;
}

export function ApiDoc(options: ApiDocOptions) {
  const decorators = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
  ];

  if (options.auth) {
    decorators.push(ApiBearerAuth());
  }

  if (options.paginated) {
    decorators.push(
      ApiQuery({ name: 'page', required: false, type: Number }),
      ApiQuery({ name: 'limit', required: false, type: Number }),
    );
  }

  decorators.push(
    ApiResponse({ status: 200, description: 'Success' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' }),
  );

  return applyDecorators(...decorators);
}
