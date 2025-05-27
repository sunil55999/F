import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  recordCount: integer("record_count").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("active"),
  fieldMapping: jsonb("field_mapping").notNull(),
});

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  firstName: text("first_name"),
  lastName: text("last_name"),
  title: text("title"),
  company: text("company"),
  email: text("email"),
  mobilePhone: text("mobile_phone"),
  otherPhone: text("other_phone"),
  corporatePhone: text("corporate_phone"),
  personLinkedinUrl: text("person_linkedin_url"),
  companyLinkedinUrl: text("company_linkedin_url"),
  website: text("website"),
  encryptedData: text("encrypted_data").notNull(),
});

export const campaignsRelations = relations(campaigns, ({ many }) => ({
  contacts: many(contacts),
}));

export const contactsRelations = relations(contacts, ({ one }) => ({
  campaign: one(campaigns, {
    fields: [contacts.campaignId],
    references: [campaigns.id],
  }),
}));

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  uploadDate: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contacts.$inferSelect;

// Field mapping types
export const fieldMappingSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  title: z.string().optional(),
  company: z.string().optional(),
  email: z.string().optional(),
  mobilePhone: z.string().optional(),
  otherPhone: z.string().optional(),
  corporatePhone: z.string().optional(),
  personLinkedinUrl: z.string().optional(),
  companyLinkedinUrl: z.string().optional(),
  website: z.string().optional(),
});

export type FieldMapping = z.infer<typeof fieldMappingSchema>;

// Standard field names for auto-detection
export const STANDARD_FIELDS = [
  "First Name",
  "Last Name", 
  "Title",
  "Company",
  "Email",
  "Mobile Phone",
  "Other Phone",
  "Corporate Phone",
  "Person Linkedin Url",
  "Company Linkedin Url",
  "Website"
] as const;
