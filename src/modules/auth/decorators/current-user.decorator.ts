import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (field: 'id' | 'email' | 'role' | undefined, context: ExecutionContext) => {
    const user = context.switchToHttp().getRequest<Request>().user;

    return field ? user?.[field] : user;
  },
);
