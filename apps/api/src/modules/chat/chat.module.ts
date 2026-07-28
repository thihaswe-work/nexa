import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { WsModule } from '../ws/ws.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [DatabaseModule, WsModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
