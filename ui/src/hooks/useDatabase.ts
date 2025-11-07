/**
 * useDatabase Hook
 * 
 * React hook for database operations
 * Database-agnostic - works with any backend
 */

import { useState, useEffect, useCallback } from 'react';
import { databaseService, DatabaseService } from '../services/database-service';
import { localFileService } from '../services/local-file-service';

export function useDatabase() {
  return databaseService;
}

export function useJSONL(file: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await databaseService.readJSONL(file);
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [file]);

  const append = useCallback(async (item: any) => {
    try {
      await databaseService.appendJSONL(file, item);
      await load();
    } catch (err: any) {
      setError(err.message);
    }
  }, [file, load]);

  useEffect(() => {
    load();
  }, [load]);

  const loadFromFile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await localFileService.loadFromFilePicker();
      if (result) {
        setData(result.data);
        console.log(`✓ Loaded ${result.data.length} items from file: ${result.filename}`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, reload: load, append, loadFromFile };
}

export function useR5RSFunction(name: string) {
  const [func, setFunc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await databaseService.getR5RSFunction(name);
      setFunc(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [name]);

  const invoke = useCallback(async (args: any[] = [], context?: any) => {
    try {
      setLoading(true);
      setError(null);
      const result = await databaseService.invokeR5RSFunction(name, args, context);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    load();
  }, [load]);

  return { func, loading, error, reload: load, invoke };
}

export function useCollection(collection: string, filter?: any, options?: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await databaseService.query(collection, filter, options);
      setItems(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collection, filter, options]);

  const create = useCallback(async (data: any) => {
    try {
      const id = await databaseService.create(collection, data);
      await load();
      return id;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [collection, load]);

  const update = useCallback(async (id: string, data: any) => {
    try {
      await databaseService.update(collection, id, data);
      await load();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [collection, load]);

  const remove = useCallback(async (id: string) => {
    try {
      await databaseService.delete(collection, id);
      await load();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [collection, load]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load, create, update, delete: remove };
}
