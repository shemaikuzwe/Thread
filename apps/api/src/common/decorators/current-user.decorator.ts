import { createParamDecorator, type ExecutionContext } from "@nestjs/common";

export const CurrentUser = createParamDecorator((key: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user;
  if (!key) {
    return user;
  }
  return user?.[key];
});
