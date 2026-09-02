import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Never rejects — just attaches req.user when a valid token is present.
  handleRequest(err: any, user: any) {
    return user || null;
  }
}