import { Injectable, LoggerService as NestLoggerService, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';

@Injectable()
export class AppLoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor(private readonly configService: AppConfigService) {
    this.logger = new Logger('Nexa');
  }

  private formatMessage(message: any, context?: string): string {
    const now = new Date();
    const timestamp =
      now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0') + ':' +
      String(now.getSeconds()).padStart(2, '0') + '.' +
      String(now.getMilliseconds()).padStart(3, '0');
    const level = context ? `[${context}]` : '';
    return `[${timestamp}] ${level} ${message}`;
  }

  log(message: any, context?: string): void {
    if (this.shouldLog('log')) {
      Logger.log(message, context);
    }
  }

  error(message: any, trace?: string, context?: string): void {
    if (this.shouldLog('error')) {
      Logger.error(message, trace, context);
    }
  }

  warn(message: any, context?: string): void {
    if (this.shouldLog('warn')) {
      Logger.warn(message, context);
    }
  }

  debug(message: any, context?: string): void {
    if (this.shouldLog('debug')) {
      Logger.debug(message, context);
    }
  }

  verbose(message: any, context?: string): void {
    if (this.shouldLog('verbose')) {
      Logger.verbose(message, context);
    }
  }

  private shouldLog(level: string): boolean {
    const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
    const configLevel = this.configService.logLevel || 'debug';
    return levels.indexOf(level) <= levels.indexOf(configLevel);
  }
}
