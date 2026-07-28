import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { NearbyController } from './nearby.controller';
import { NearbyService } from './nearby.service';

@Module({
  imports: [DatabaseModule],
  controllers: [NearbyController],
  providers: [NearbyService],
  exports: [NearbyService],
})
export class NearbyModule {}
