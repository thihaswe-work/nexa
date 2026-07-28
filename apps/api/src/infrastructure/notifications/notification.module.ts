import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from '../../config/config.module';
import { DatabaseModule } from '../../database/database.module';
import { FcmService } from './fcm.service';
import { NotificationQueueService } from './notification-queue.service';
import { NotificationsService } from './notification.service';

@Global()
@Module({
  imports: [AppConfigModule, DatabaseModule],
  providers: [
    FcmService,
    NotificationQueueService,
    NotificationsService,
  ],
  exports: [
    FcmService,
    NotificationQueueService,
    NotificationsService,
  ],
})
export class NotificationsInfraModule {}
