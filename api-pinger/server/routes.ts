import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import path from "path";
import fs from "fs";
import multer from "multer";

// Set up multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

export async function registerRoutes(app: Express): Promise<Server> {
  // API route to get API configuration
  app.get('/api/config', (req: Request, res: Response) => {
    try {
      const configPath = path.join(process.cwd(), 'src', 'config', 'api.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      
      // Parse the JSON data
      const config = JSON.parse(configData);
      
      res.json(config);
    } catch (error) {
      console.error('Error loading API configuration:', error);
      res.status(500).json({ 
        error: 'Failed to load API configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to export API configuration
  app.get('/api/config/export', (req: Request, res: Response) => {
    try {
      const configPath = path.join(process.cwd(), 'src', 'config', 'api.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=api-config.json');
      res.send(configData);
    } catch (error) {
      console.error('Error exporting API configuration:', error);
      res.status(500).json({
        error: 'Failed to export API configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Route to import API configuration
  app.post('/api/config/import', upload.single('config'), (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      // Read the uploaded file
      const fileData = fs.readFileSync(req.file.path, 'utf8');
      
      // Validate that it's proper JSON
      try {
        JSON.parse(fileData);
      } catch (err) {
        // Clean up the uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
      
      // Save the configuration
      const configPath = path.join(process.cwd(), 'src', 'config', 'api.json');
      fs.writeFileSync(configPath, fileData);
      
      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);
      
      res.json({ success: true, message: 'Configuration imported successfully' });
    } catch (error) {
      console.error('Error importing API configuration:', error);
      
      // Clean up the uploaded file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Error removing uploaded file:', unlinkError);
        }
      }
      
      res.status(500).json({
        error: 'Failed to import API configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Add mock API endpoints for demonstration
  
  // Auth endpoints
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Simple mock authentication
    if (email === 'user@example.com' && password === 'password') {
      res.json({
        success: true,
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'user'
          }
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
  });
  
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: '124',
          email: email,
          name: name,
          role: 'user'
        }
      }
    });
  });
  
  app.get('/api/auth/logout', (req: Request, res: Response) => {
    res.json({
      success: true,
      message: 'Successfully logged out'
    });
  });
  
  // Users endpoints
  app.get('/api/users', (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    res.json({
      success: true,
      data: {
        users: [
          {
            id: '123',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'user'
          },
          {
            id: '124',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin'
          }
        ],
        pagination: {
          page,
          limit,
          total: 2
        }
      }
    });
  });
  
  app.get('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (id === '123') {
      res.json({
        success: true,
        data: {
          user: {
            id: '123',
            email: 'user@example.com',
            name: 'John Doe',
            role: 'user',
            created_at: '2023-01-15T08:30:00Z'
          }
        }
      });
    } else if (id === '124') {
      res.json({
        success: true,
        data: {
          user: {
            id: '124',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            created_at: '2023-01-10T10:15:00Z'
          }
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: `User with ID ${id} not found`
      });
    }
  });
  
  app.put('/api/users/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, role } = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    if (!name && !role) {
      return res.status(400).json({
        success: false,
        message: 'At least one field (name or role) is required for update'
      });
    }
    
    res.json({
      success: true,
      data: {
        user: {
          id,
          email: 'user@example.com',
          name: name || 'John Doe',
          role: role || 'user',
          updated_at: new Date().toISOString()
        }
      }
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
