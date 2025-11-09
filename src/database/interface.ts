/**
 * Database Abstraction Interface
 * 
 * Provides a unified interface for different database backends
 * Supports JSONL, R5RS functions, and custom databases
 */

export interface DatabaseAdapter {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;

  // JSONL operations
  readJSONL(filePath: string): Promise<any[]>;
  writeJSONL(filePath: string, data: any[]): Promise<void>;
  appendJSONL(filePath: string, data: any): Promise<void>;
  queryJSONL(filePath: string, predicate: (item: any) => boolean): Promise<any[]>;

  // R5RS Function operations
  getR5RSFunction(functionName: string): Promise<any>;
  listR5RSFunctions(pattern?: string): Promise<string[]>;
  registerR5RSFunction(functionName: string, definition: any): Promise<void>;
  invokeR5RSFunction(functionName: string, args: any[], context?: any): Promise<any>;

  // Generic CRUD operations
  create(collection: string, data: any): Promise<string>;
  read(collection: string, id: string): Promise<any | null>;
  update(collection: string, id: string, data: any): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  query(collection: string, filter: any, options?: QueryOptions): Promise<any[]>;

  // Batch operations
  batchCreate(collection: string, items: any[]): Promise<string[]>;
  batchUpdate(collection: string, updates: { id: string; data: any }[]): Promise<void>;
  batchDelete(collection: string, ids: string[]): Promise<void>;

  // Transactions
  beginTransaction(): Promise<Transaction>;
  commitTransaction(transaction: Transaction): Promise<void>;
  rollbackTransaction(transaction: Transaction): Promise<void>;

  // Schema/Collection management
  createCollection(collection: string, schema?: any): Promise<void>;
  dropCollection(collection: string): Promise<void>;
  listCollections(): Promise<string[]>;

  // Indexing
  createIndex(collection: string, fields: string[]): Promise<void>;
  dropIndex(collection: string, indexName: string): Promise<void>;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: { field: string; direction: 'asc' | 'desc' }[];
  projection?: string[];
}

export interface Transaction {
  id: string;
  startedAt: Date;
}

export interface DatabaseConfig {
  type: 'jsonl' | 'redis' | 'postgres' | 'mongodb' | 'sqlite' | 'custom';
  connectionString?: string;
  options?: Record<string, any>;
  adapter?: DatabaseAdapter; // For custom adapters
}
