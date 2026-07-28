import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { WsGateway } from './ws.gateway';
import { WsConnectionManager } from './ws.connection.manager';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          issuer: config.get<string>('JWT_ISSUER', 'nexa-api'),
        },
      }),
    }),
  ],
  providers: [WsGateway, WsConnectionManager],
  exports: [WsGateway, WsConnectionManager],
})
export class WsModule {}
