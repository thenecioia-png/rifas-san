import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';
import * as http from 'http';

@Injectable()
export class KeepAliveService implements OnModuleInit {
  private readonly logger = new Logger(KeepAliveService.name);
  private intervalId: ReturnType<typeof setInterval>;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const isRender = this.configService.get<string>('RENDER') === 'true';
    const selfUrl = this.configService.get<string>('SELF_URL');

    if (isRender && selfUrl) {
      this.logger.log(`🔥 Keep-alive activado. Auto-ping cada 14 min a ${selfUrl}`);
      this.intervalId = setInterval(() => {
        this.pingSelf(selfUrl);
      }, 14 * 60 * 1000); // 14 minutos

      this.pingSelf(selfUrl);
    }
  }

  private pingSelf(url: string) {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(`${url}/api/v1/health/ping`, { timeout: 10000 }, (res) => {
      this.logger.debug(`Keep-alive ping OK: ${res.statusCode}`);
    });

    req.on('error', (err) => {
      this.logger.warn(`Keep-alive ping falló: ${err.message}`);
    });

    req.end();
  }
}
