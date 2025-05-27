import { campaigns, contacts, type Campaign, type InsertCampaign, type Contact, type InsertContact, type FieldMapping } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Campaign methods
  getCampaigns(): Promise<Campaign[]>;
  getCampaignById(id: number): Promise<Campaign | undefined>;
  getCampaignByName(name: string): Promise<Campaign | undefined>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  deleteCampaign(id: number): Promise<void>;
  
  // Contact methods
  getContactsByCampaignId(campaignId: number, limit?: number, offset?: number): Promise<Contact[]>;
  getContactsCountByCampaignId(campaignId: number): Promise<number>;
  createContacts(contacts: InsertContact[]): Promise<Contact[]>;
  searchContactsInCampaign(campaignId: number, searchQuery: string): Promise<Contact[]>;
}

export class DatabaseStorage implements IStorage {
  async getCampaigns(): Promise<Campaign[]> {
    return await db.select().from(campaigns).orderBy(desc(campaigns.uploadDate));
  }

  async getCampaignById(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign || undefined;
  }

  async getCampaignByName(name: string): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.name, name));
    return campaign || undefined;
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db
      .insert(campaigns)
      .values(insertCampaign)
      .returning();
    return campaign;
  }

  async deleteCampaign(id: number): Promise<void> {
    await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  async getContactsByCampaignId(campaignId: number, limit = 50, offset = 0): Promise<Contact[]> {
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.campaignId, campaignId))
      .limit(limit)
      .offset(offset);
  }

  async getContactsCountByCampaignId(campaignId: number): Promise<number> {
    const result = await db
      .select({ count: contacts.id })
      .from(contacts)
      .where(eq(contacts.campaignId, campaignId));
    return result.length;
  }

  async createContacts(insertContacts: InsertContact[]): Promise<Contact[]> {
    if (insertContacts.length === 0) return [];
    
    return await db
      .insert(contacts)
      .values(insertContacts)
      .returning();
  }

  async searchContactsInCampaign(campaignId: number, searchQuery: string): Promise<Contact[]> {
    // Simple search implementation - in production, consider using full-text search
    return await db
      .select()
      .from(contacts)
      .where(eq(contacts.campaignId, campaignId))
      .limit(100); // Return first 100 results for search
  }
}

export const storage = new DatabaseStorage();
