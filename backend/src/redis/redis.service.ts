import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// Mock in-memory Redis para cuando no hay REDIS_URL configurado
class InMemoryRedis {
  private store = new Map<string, { value: string; expiresAt?: number }>();
  private listeners: Record<string, ((...args: any[]) => void)[]> = {};

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
    if (event === 'connect') setTimeout(() => callback(), 0);
    return this;
  }

  async get(key: string): Promise<string | null> {
    const item = this.store.get(key);
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return item?.value ?? null;
  }

  async set(key: string, value: string): Promise<'OK'> {
    this.store.set(key, { value });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    this.store.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    return 'OK';
  }

  async del(...keys: string[]): Promise<number> {
    let count = 0;
    for (const key of keys) {
      if (this.store.delete(key)) count++;
    }
    return count;
  }

  async exists(key: string): Promise<number> {
    const item = this.store.get(key);
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      this.store.delete(key);
      return 0;
    }
    return item ? 1 : 0;
  }

  async ping(): Promise<string> {
    return 'PONG';
  }

  disconnect() {
    this.store.clear();
  }
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | InMemoryRedis;
  private pubClient: Redis | InMemoryRedis;
  private subClient: Redis | InMemoryRedis;
  private useMemory = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl || redisUrl === 'memory' || redisUrl === '') {
      this.useMemory = true;
      this.logger.warn('⚠️  REDIS_URL no configurado. Usando Redis en memoria (NO para produccion con multiples instancias)');
      this.client = new InMemoryRedis();
      this.pubClient = new InMemoryRedis();
      this.subClient = new InMemoryRedis();
      return;
    }
    
    this.client = new Redis(redisUrl, {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
    });

    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);

    this.client.on('connect', () => this.logger.log('✅ Redis connected'));
    this.client.on('error', (err) => this.logger.error('Redis error:', err));
  }

  onModuleDestroy() {
    this.client.disconnect();
    this.pubClient.disconnect();
    this.subClient.disconnect();
  }

  getClient(): Redis | InMemoryRedis {
    return this.client;
  }

  getPubClient(): Redis | InMemoryRedis {
    return this.pubClient;
  }

  getSubClient(): Redis | InMemoryRedis {
    return this.subClient;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.useMemory) {
      if (ttl) {
        await (this.client as InMemoryRedis).setex(key, ttl, value);
      } else {
        await (this.client as InMemoryRedis).set(key, value);
      }
      return;
    }
    if (ttl) {
      await (this.client as Redis).setex(key, ttl, value);
    } else {
      await (this.client as Redis).set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory) {
      return (this.client as InMemoryRedis).get(key);
    }
    return (this.client as Redis).get(key);
  }

  async del(key: string): Promise<void> {
    if (this.useMemory) {
      await (this.client as InMemoryRedis).del(key);
      return;
    }
    await (this.client as Redis).del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (this.useMemory) {
      const result = await (this.client as InMemoryRedis).exists(key);
      return result === 1;
    }
    const result = await (this.client as Redis).exists(key);
    return result === 1;
  }

  async acquireLock(lockKey: string, ttlSeconds: number = 30): Promise<boolean> {
    if (this.useMemory) {
      const exists = await (this.client as InMemoryRedis).exists(lockKey);
      if (exists) return false;
      await (this.client as InMemoryRedis).setex(lockKey, ttlSeconds, '1');
      return true;
    }
    const token = Date.now().toString();
    const result = await (this.client as Redis).set(lockKey, token, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async releaseLock(lockKey: string): Promise<void> {
    if (this.useMemory) {
      await (this.client as InMemoryRedis).del(lockKey);
      return;
    }
    await (this.client as Redis).del(lockKey);
  }
}
