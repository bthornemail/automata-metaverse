/**
 * Database Factory
 * 
 * Creates appropriate database adapter based on configuration
 */

import { DatabaseAdapter, DatabaseConfig } from './interface';
import { JSONLAdapter } from './adapters/jsonl-adapter';

export class DatabaseFactory {
  static create(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'jsonl':
        return new JSONLAdapter(config.options?.basePath || './data');
      
      case 'redis':
        // TODO: Implement RedisAdapter
        throw new Error('Redis adapter not yet implemented');
      
      case 'postgres':
        // TODO: Implement PostgresAdapter
        throw new Error('Postgres adapter not yet implemented');
      
      case 'mongodb':
        // TODO: Implement MongoAdapter
        throw new Error('MongoDB adapter not yet implemented');
      
      case 'sqlite':
        // TODO: Implement SQLiteAdapter
        throw new Error('SQLite adapter not yet implemented');
      
      case 'custom':
        if (!config.adapter) {
          throw new Error('Custom adapter must be provided');
        }
        return config.adapter;
      
      default:
        throw new Error(`Unknown database type: ${config.type}`);
    }
  }

  static fromEnvironment(): DatabaseAdapter {
    const dbType = process.env.DB_TYPE || 'jsonl';
    const dbPath = process.env.DB_PATH || './data';
    
    return this.create({
      type: dbType as any,
      options: {
        basePath: dbPath,
        connectionString: process.env.DB_CONNECTION_STRING
      }
    });
  }
}
