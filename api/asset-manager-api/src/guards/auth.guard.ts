import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector){}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if(!roles) {
      return true;
    } else {
      return this.matchRoles(roles, context.getHandler().name);
    }
  }

  matchRoles(roles: string[], handler: string): boolean {
    if(roles.indexOf('all') >= 0) {
      return true;
    }

    switch(handler) {
      case 'getAllAssets':
        return true;
    }
    return false;
  }
}
