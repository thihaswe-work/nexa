import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PostgisService } from './postgis.service';

@Global()
@Module({
  providers: [DatabaseService, PostgisService],
  exports: [DatabaseService, PostgisService],
})
export class DatabaseModule {}
