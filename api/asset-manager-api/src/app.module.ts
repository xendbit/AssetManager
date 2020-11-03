import { User } from './models/user.model';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';
import { AuthGuard } from './guards/auth.guard';
import { AssetsController } from './controllers/assets.controller';
import { Module } from '@nestjs/common';
import { AssetsService } from './services/assets.service';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'AssetManager.db',
      entities: [__dirname + '/**/*.model{.ts,.js}'],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [
    AssetsController,
    UserController,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    AssetsService,
    UserService,
  ],
})
export class AppModule { }
