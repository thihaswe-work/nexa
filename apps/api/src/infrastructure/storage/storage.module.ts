import { Global, Module } from '@nestjs/common';
import { StorageService, FileCategory } from './storage.service';
import { AppConfigModule } from '../../config/config.module';

export { FileCategory };

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
