import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCampaignSchema, insertContactSchema, fieldMappingSchema, type FieldMapping } from "@shared/schema";
import multer, { type FileFilterCallback } from "multer";
import csv from "csv-parser";
import crypto from "crypto";
import { z } from "zod";
import { Readable } from "stream";

// Extend Request interface to include file
interface MulterRequest extends Request {
  file?: any;
}

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: any, file: any, cb: FileFilterCallback) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  const password = req.headers.authorization?.replace('Bearer ', '');
  
  // Hardcoded password for MVP - should be environment variable in production
  const validPassword = process.env.ACCESS_PASSWORD || 'demo123';
  
  if (password !== validPassword) {
    return res.status(401).json({ message: 'Invalid password' });
  }
  
  next();
};

// Encryption utilities
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedData: string): string {
  try {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    // If decryption fails, return the raw data
    console.warn('Decryption failed, returning raw data:', error);
    return encryptedData;
  }
}

// CSV parsing utilities
function detectFields(headers: string[]): Partial<FieldMapping> {
  const mapping: Partial<FieldMapping> = {};
  
  // Auto-detect standard field mappings
  const fieldPatterns = {
    firstName: ['first name', 'firstname', 'fname', 'first_name'],
    lastName: ['last name', 'lastname', 'lname', 'last_name'],
    title: ['title', 'job title', 'position', 'role', 'job_title'],
    company: ['company', 'organization', 'employer', 'company_name'],
    email: ['email', 'email address', 'e-mail', 'email_address'],
    mobilePhone: ['mobile', 'mobile phone', 'cell', 'cell phone', 'mobile_phone'],
    otherPhone: ['phone', 'other phone', 'telephone', 'other_phone'],
    corporatePhone: ['corporate phone', 'work phone', 'office phone', 'corporate_phone'],
    personLinkedinUrl: ['linkedin', 'person linkedin', 'personal linkedin', 'person_linkedin_url'],
    companyLinkedinUrl: ['company linkedin', 'company_linkedin_url'],
    website: ['website', 'url', 'web', 'site']
  };
  
  headers.forEach(header => {
    const normalizedHeader = header.toLowerCase().trim();
    
    Object.entries(fieldPatterns).forEach(([field, patterns]) => {
      if (patterns.some(pattern => normalizedHeader.includes(pattern))) {
        mapping[field as keyof FieldMapping] = header;
      }
    });
  });
  
  return mapping;
}

async function parseCSV(buffer: Buffer): Promise<{ headers: string[], rows: any[] }> {
  return new Promise((resolve, reject) => {
    const headers: string[] = [];
    const rows: any[] = [];
    let isFirstRow = true;
    
    const stream = Readable.from(buffer.toString());
    
    stream
      .pipe(csv())
      .on('headers', (headerList) => {
        headers.push(...headerList);
      })
      .on('data', (row) => {
        if (isFirstRow) {
          isFirstRow = false;
          headers.length === 0 && headers.push(...Object.keys(row));
        }
        rows.push(row);
      })
      .on('end', () => {
        resolve({ headers, rows });
      })
      .on('error', reject);
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication endpoint
  app.post('/api/auth', (req, res) => {
    const { password } = req.body;
    const validPassword = process.env.ACCESS_PASSWORD || 'demo123';
    
    if (password === validPassword) {
      res.json({ success: true, token: password });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  });
  
  // Get all campaigns
  app.get('/api/campaigns', requireAuth, async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });
  
  // Get campaign by ID
  app.get('/api/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await storage.getCampaignById(id);
      
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      res.json(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      res.status(500).json({ message: 'Failed to fetch campaign' });
    }
  });
  
  // Get contacts for a campaign
  app.get('/api/campaigns/:id/contacts', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const search = req.query.search as string;
      
      let contacts;
      if (search) {
        contacts = await storage.searchContactsInCampaign(id, search);
      } else {
        // Get ALL contacts without pagination
        contacts = await storage.getContactsByCampaignId(id, 10000, 0);
      }
      
      // Return contact data directly - no encryption/decryption needed
      const processedContacts = contacts.map(contact => ({
        id: contact.id,
        campaignId: contact.campaignId,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        company: contact.company || '',
        title: contact.title || '',
        mobilePhone: contact.mobilePhone || '',
        otherPhone: contact.otherPhone || '',
        corporatePhone: contact.corporatePhone || '',
        personLinkedinUrl: contact.personLinkedinUrl || '',
        companyLinkedinUrl: contact.companyLinkedinUrl || '',
        website: contact.website || ''
      }));
      
      const totalCount = processedContacts.length;
      
      res.json({
        contacts: processedContacts,
        pagination: {
          page: 1,
          limit: totalCount,
          total: totalCount,
          totalPages: 1
        }
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });
  
  // Parse CSV file and return headers for mapping
  app.post('/api/csv/parse', requireAuth, upload.single('csvFile'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file provided' });
      }
      
      const { headers, rows } = await parseCSV(req.file.buffer);
      const detectedMapping = detectFields(headers);
      
      res.json({
        headers,
        detectedMapping,
        rowCount: rows.length,
        fileName: req.file.originalname,
        fileSize: req.file.size
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      res.status(500).json({ message: 'Failed to parse CSV file' });
    }
  });
  
  // Upload and save campaign
  app.post('/api/campaigns', requireAuth, upload.single('csvFile'), async (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No CSV file provided' });
      }
      
      const { campaignName, fieldMapping: fieldMappingRaw } = req.body;
      
      if (!campaignName) {
        return res.status(400).json({ message: 'Campaign name is required' });
      }
      
      // Validate field mapping
      const fieldMapping = fieldMappingSchema.parse(JSON.parse(fieldMappingRaw));
      
      // Check if campaign name already exists
      const existingCampaign = await storage.getCampaignByName(campaignName);
      if (existingCampaign) {
        return res.status(400).json({ message: 'Campaign name already exists' });
      }
      
      // Parse CSV
      const { headers, rows } = await parseCSV(req.file.buffer);
      
      // Create campaign
      const campaignData = insertCampaignSchema.parse({
        name: campaignName,
        fileName: req.file.originalname,
        recordCount: rows.length,
        fileSize: req.file.size,
        fieldMapping
      });
      
      const campaign = await storage.createCampaign(campaignData);
      
      // Process and encrypt contact data
      const contactsData = rows.map(row => {
        const contactData: any = {};
        
        // Map fields based on field mapping
        Object.entries(fieldMapping).forEach(([standardField, csvColumn]) => {
          if (csvColumn && csvColumn !== 'skip' && row[csvColumn]) {
            contactData[standardField] = row[csvColumn];
          }
        });
        
        // Encrypt the contact data
        const encryptedData = encrypt(JSON.stringify(contactData));
        
        return insertContactSchema.parse({
          campaignId: campaign.id,
          encryptedData,
          ...contactData
        });
      });
      
      // Save contacts in batches
      const batchSize = 100;
      for (let i = 0; i < contactsData.length; i += batchSize) {
        const batch = contactsData.slice(i, i + batchSize);
        await storage.createContacts(batch);
      }
      
      res.json({ 
        success: true, 
        campaign,
        message: `Campaign "${campaignName}" uploaded successfully with ${rows.length} contacts`
      });
      
    } catch (error) {
      console.error('Error uploading campaign:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid data format', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to upload campaign' });
      }
    }
  });
  
  // Delete campaign
  app.delete('/api/campaigns/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCampaign(id);
      res.json({ success: true, message: 'Campaign deleted successfully' });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ message: 'Failed to delete campaign' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
