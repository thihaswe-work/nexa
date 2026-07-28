import { Global, Module } from '@nestjs/common';
import { StorageService, FileCategory } from './storage.service';

export { FileCategory };

@Global()
@Module({
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
