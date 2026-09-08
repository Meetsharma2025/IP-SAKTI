import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  serial,
  varchar,
  real,
} from "drizzle-orm/pg-core";

// ========== KNOWLEDGE GRAPH ENTITIES ==========

// Version-tracked legal documents — the curated corpus
export const knowledgeDocuments = pgTable("knowledge_documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 50 }).notNull(),
  ipType: varchar("ip_type", { length: 100 }).notNull(),
  content: text("content").notNull(),
  citation: text("citation").notNull(),
  sourceUrl: text("source_url"),
  // Version tracking
  version: varchar("version", { length: 50 }),
  effectiveDate: varchar("effective_date", { length: 50 }),
  supersededBy: integer("superseded_by"),
  isCurrentVersion: boolean("is_current_version").notNull().default(true),
  lastVerifiedAt: timestamp("last_verified_at"),
  // Authority metadata
  authorityLevel: varchar("authority_level", { length: 50 }).notNull().default("primary"),
  enactingBody: text("enacting_body"),
  tags: text("tags"),
  // Search optimization
  searchTokens: text("search_tokens"),
  // Embedding vector stored as JSON array of floats (since pgvector is unavailable)
  embedding: jsonb("embedding"),
  // Content hash for change detection during source verification
  contentHash: varchar("content_hash", { length: 64 }),
  // Source verification
  verificationStatus: varchar("verification_status", { length: 30 }).default("unverified"),
  // unverified, verified, stale, unreachable
  verificationNote: text("verification_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Knowledge graph edges — relationships between legal entities
export const knowledgeRelations = pgTable("knowledge_relations", {
  id: serial("id").primaryKey(),
  sourceDocId: integer("source_doc_id").notNull(),
  targetDocId: integer("target_doc_id").notNull(),
  relationType: varchar("relation_type", { length: 100 }).notNull(),
  // amends, supersedes, implements, references, conflicts_with, complements, enforces
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Legal entities for knowledge graph nodes
export const legalEntities = pgTable("legal_entities", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  // statute, section, rule, treaty, authority, product_category, ip_type, biological_resource
  name: text("name").notNull(),
  shortName: varchar("short_name", { length: 100 }),
  jurisdiction: varchar("jurisdiction", { length: 50 }),
  parentId: integer("parent_id"), // hierarchical relationships
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Entity-Document links
export const entityDocumentLinks = pgTable("entity_document_links", {
  id: serial("id").primaryKey(),
  entityId: integer("entity_id").notNull(),
  documentId: integer("document_id").notNull(),
  relevanceScore: real("relevance_score").notNull().default(1.0),
});

// ========== CONVERSATIONS ==========

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  jurisdiction: varchar("jurisdiction", { length: 50 }).notNull().default("india"),
  language: varchar("language", { length: 20 }).notNull().default("en"),
  productCategory: varchar("product_category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  citations: jsonb("citations"),
  confidence: integer("confidence"),
  agentTrace: jsonb("agent_trace"), // stores multi-agent reasoning trace
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== PRODUCT CLASSIFICATION ==========

export const productClassifications = pgTable("product_classifications", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  productName: text("product_name"),
  productDescription: text("product_description"),
  category: varchar("category", { length: 100 }),
  isFromAuthoritativeText: boolean("is_from_authoritative_text"),
  hasNovelModification: boolean("has_novel_modification"),
  containsBiologicalResource: boolean("contains_biological_resource"),
  intendedUse: varchar("intended_use", { length: 100 }),
  classificationResult: jsonb("classification_result"),
  ipRecommendations: jsonb("ip_recommendations"),
  absRequired: boolean("abs_required"),
  uncertaintyFlags: jsonb("uncertainty_flags"), // tracks what's uncertain
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== ESCALATION ==========

export const escalationRequests = pgTable("escalation_requests", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }).notNull(),
  conversationId: integer("conversation_id"),
  reason: text("reason").notNull(),
  userQuery: text("user_query").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== SOURCE VERIFICATION LOG ==========

export const verificationLog = pgTable("verification_log", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  sourceUrl: text("source_url"),
  httpStatus: integer("http_status"),
  reachable: boolean("reachable").notNull(),
  contentChanged: boolean("content_changed"),
  previousHash: varchar("previous_hash", { length: 64 }),
  newHash: varchar("new_hash", { length: 64 }),
  verifiedAt: timestamp("verified_at").defaultNow().notNull(),
  note: text("note"),
});

// ========== AUDIT LOG ==========

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 100 }),
  action: varchar("action", { length: 100 }).notNull(),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== MULTI-TENANT: ORGANIZATIONS ==========

export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  orgType: varchar("org_type", { length: 50 }).notNull(),
  // msme, startup, cultivator, researcher, practitioner, facilitator, institution
  sector: varchar("sector", { length: 100 }).default("ayurveda"),
  description: text("description"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  gstNumber: varchar("gst_number", { length: 20 }),
  targetMarkets: jsonb("target_markets"), // ["india","eu","usa"]
  existingLicenses: jsonb("existing_licenses"), // [{type, number, expiry}]
  preferences: jsonb("preferences"), // {language, jurisdiction, notifyUpdates}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orgMembers = pgTable("org_members", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: varchar("role", { length: 50 }).notNull().default("member"),
  // owner, admin, ip_manager, regulatory_manager, researcher, viewer
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== CLIENT PRODUCTS ==========

export const clientProducts = pgTable("client_products", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  // classical, proprietary, new_drug, phytopharma, nutraceutical, cosmetic
  ingredients: jsonb("ingredients"), // [{name, botanical, part, source}]
  therapeuticClaims: text("therapeutic_claims"),
  targetMarkets: jsonb("target_markets"),
  regulatoryStatus: varchar("regulatory_status", { length: 100 }),
  classificationResult: jsonb("classification_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== CLIENT IP ASSETS ==========

export const clientIPAssets = pgTable("client_ip_assets", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  productId: integer("product_id"),
  ipType: varchar("ip_type", { length: 50 }).notNull(),
  // patent, trademark, gi, design, copyright, trade_secret, plant_variety
  status: varchar("status", { length: 50 }).notNull(),
  // planned, filed, pending, granted, expired, abandoned
  title: text("title").notNull(),
  applicationNumber: varchar("application_number", { length: 100 }),
  registrationNumber: varchar("registration_number", { length: 100 }),
  filingDate: varchar("filing_date", { length: 20 }),
  grantDate: varchar("grant_date", { length: 20 }),
  expiryDate: varchar("expiry_date", { length: 20 }),
  jurisdiction: varchar("jurisdiction", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== CLIENT DOCUMENTS (private knowledge) ==========

export const clientDocuments = pgTable("client_documents", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  productId: integer("product_id"),
  title: text("title").notNull(),
  docType: varchar("doc_type", { length: 50 }).notNull(),
  // product_spec, formulation, certificate, license, research, patent_doc, regulatory, other
  content: text("content").notNull(),
  tags: text("tags"),
  embedding: jsonb("embedding"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== CLIENT COMPLIANCE TRACKER ==========

export const clientCompliance = pgTable("client_compliance", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").notNull(),
  productId: integer("product_id"),
  requirementType: varchar("requirement_type", { length: 100 }).notNull(),
  // abs_clearance, manufacturing_license, gmp_cert, fssai_license, export_cert, trademark_renewal
  description: text("description").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  // pending, in_progress, completed, overdue, not_applicable
  dueDate: varchar("due_date", { length: 20 }),
  completedDate: varchar("completed_date", { length: 20 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
