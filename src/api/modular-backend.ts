/**
 * Modular Backend API
 * 
 * Database-agnostic backend API that works with any database adapter
 */

import { DatabaseAdapter } from '../database/interface';
import { DatabaseFactory } from '../database/factory';
import express, { Request, Response, Router } from 'express';
import { BasesApiService } from '../services/bases-api';

export class ModularBackend {
  private db: DatabaseAdapter;
  private app: express.Application;
  private router: Router;
  private basesService: BasesApiService;

  constructor(db?: DatabaseAdapter) {
    this.db = db || DatabaseFactory.fromEnvironment();
    this.app = express();
    this.router = Router();
    this.basesService = new BasesApiService('./');
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use('/api', this.router);
  }

  private setupRoutes(): void {
    // Health check
    this.router.get('/health', async (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        database: this.db.isConnected() ? 'connected' : 'disconnected' 
      });
    });

    // JSONL operations
    this.router.get('/jsonl/:file', async (req: Request, res: Response) => {
      try {
        const data = await this.db.readJSONL(req.params.file);
        res.json({ success: true, data });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/jsonl/:file', async (req: Request, res: Response) => {
      try {
        await this.db.writeJSONL(req.params.file, req.body.data || []);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/jsonl/:file/append', async (req: Request, res: Response) => {
      try {
        await this.db.appendJSONL(req.params.file, req.body);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // R5RS Function operations
    this.router.get('/r5rs/functions', async (req: Request, res: Response) => {
      try {
        const pattern = req.query.pattern as string | undefined;
        const functions = await this.db.listR5RSFunctions(pattern);
        res.json({ success: true, data: functions });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.get('/r5rs/functions/:name', async (req: Request, res: Response) => {
      try {
        const func = await this.db.getR5RSFunction(req.params.name);
        if (!func) {
          return res.status(404).json({ success: false, error: 'Function not found' });
        }
        res.json({ success: true, data: func });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/r5rs/functions/:name/invoke', async (req: Request, res: Response) => {
      try {
        const result = await this.db.invokeR5RSFunction(
          req.params.name,
          req.body.args || [],
          req.body.context
        );
        res.json({ success: true, data: result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/r5rs/functions/:name/register', async (req: Request, res: Response) => {
      try {
        await this.db.registerR5RSFunction(req.params.name, req.body);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Generic CRUD operations
    this.router.post('/:collection', async (req: Request, res: Response) => {
      try {
        const id = await this.db.create(req.params.collection, req.body);
        res.json({ success: true, data: { id } });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.get('/:collection/:id', async (req: Request, res: Response) => {
      try {
        const item = await this.db.read(req.params.collection, req.params.id);
        if (!item) {
          return res.status(404).json({ success: false, error: 'Not found' });
        }
        res.json({ success: true, data: item });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.put('/:collection/:id', async (req: Request, res: Response) => {
      try {
        await this.db.update(req.params.collection, req.params.id, req.body);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.delete('/:collection/:id', async (req: Request, res: Response) => {
      try {
        await this.db.delete(req.params.collection, req.params.id);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.get('/:collection', async (req: Request, res: Response) => {
      try {
        const filter = req.query.filter ? JSON.parse(req.query.filter as string) : {};
        const options = {
          limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
          offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
          sort: req.query.sort ? JSON.parse(req.query.sort as string) : undefined,
          projection: req.query.projection ? (req.query.projection as string).split(',') : undefined
        };
        
        const items = await this.db.query(req.params.collection, filter, options);
        res.json({ success: true, data: items });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Bases endpoints
    this.router.post('/bases/parse', async (req: Request, res: Response) => {
      try {
        const { filePath } = req.body;
        if (!filePath) {
          return res.status(400).json({ success: false, error: 'filePath is required' });
        }
        const base = await this.basesService.parseBase(filePath);
        res.json({ success: true, data: base });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/bases/convert', async (req: Request, res: Response) => {
      try {
        const { filePath, options } = req.body;
        if (!filePath) {
          return res.status(400).json({ success: false, error: 'filePath is required' });
        }
        const base = await this.basesService.convertToBase(filePath, options);
        res.json({ success: true, data: base });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/bases/convert-back', async (req: Request, res: Response) => {
      try {
        const { base, options } = req.body;
        if (!base) {
          return res.status(400).json({ success: false, error: 'base is required' });
        }
        const converted = await this.basesService.convertBaseToJSONL(base, options || {});
        res.json({ success: true, data: converted });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/bases/roundtrip', async (req: Request, res: Response) => {
      try {
        const { filePath } = req.body;
        if (!filePath) {
          return res.status(400).json({ success: false, error: 'filePath is required' });
        }
        const result = await this.basesService.roundTripJSONL(filePath);
        res.json({ success: true, data: result });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.get('/bases/list', async (req: Request, res: Response) => {
      try {
        const directory = (req.query.directory as string) || '.';
        const files = await this.basesService.listBaseFiles(directory);
        res.json({ success: true, data: files });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/bases/save', async (req: Request, res: Response) => {
      try {
        const { base, filePath } = req.body;
        if (!base || !filePath) {
          return res.status(400).json({ success: false, error: 'base and filePath are required' });
        }
        await this.basesService.saveBase(base, filePath);
        res.json({ success: true });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.router.post('/bases/embed', async (req: Request, res: Response) => {
      try {
        const { filePath, options } = req.body;
        if (!filePath) {
          return res.status(400).json({ success: false, error: 'filePath is required' });
        }
        const html = await this.basesService.createBaseEmbed(filePath, options);
        res.json({ success: true, data: html });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  async initialize(): Promise<void> {
    await this.db.connect();
  }

  async shutdown(): Promise<void> {
    await this.db.disconnect();
  }
}
