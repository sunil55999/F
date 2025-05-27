import type { FieldMapping } from "@shared/schema";

// CSV field detection utilities
export function detectCSVFields(headers: string[]): Partial<FieldMapping> {
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

export function parseCSVFile(file: File): Promise<{ headers: string[], rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('CSV file is empty'));
          return;
        }
        
        // Parse header
        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        
        // Parse rows
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(value => value.trim().replace(/"/g, ''));
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          return row;
        });
        
        resolve({ headers, rows });
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    return { valid: false, error: 'Please select a CSV file' };
  }
  
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }
  
  return { valid: true };
}
