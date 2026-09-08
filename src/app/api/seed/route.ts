import { NextResponse } from "next/server";
import { db } from "@/db";
import { knowledgeDocuments, knowledgeRelations, legalEntities } from "@/db/schema";
import { knowledgeSeed } from "@/lib/knowledge-seed";
import { sql } from "drizzle-orm";
import { generateLocalEmbedding } from "@/lib/embeddings";
import * as crypto from "crypto";

export const runtime = "nodejs";
export async function POST() {
  try {
    // Ensure tables exist (safe for first deploy)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS knowledge_documents (
        id SERIAL PRIMARY KEY, title TEXT NOT NULL, category VARCHAR(100) NOT NULL,
        jurisdiction VARCHAR(50) NOT NULL, ip_type VARCHAR(100) NOT NULL,
        content TEXT NOT NULL, citation TEXT NOT NULL, source_url TEXT,
        version VARCHAR(50), effective_date VARCHAR(50), superseded_by INTEGER,
        is_current_version BOOLEAN NOT NULL DEFAULT true, last_verified_at TIMESTAMP,
        authority_level VARCHAR(50) NOT NULL DEFAULT 'primary', enacting_body TEXT,
        tags TEXT, search_tokens TEXT, embedding JSONB, content_hash VARCHAR(64),
        verification_status VARCHAR(30) DEFAULT 'unverified', verification_note TEXT,
        created_at TIMESTAMP DEFAULT now() NOT NULL, updated_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS knowledge_relations (
        id SERIAL PRIMARY KEY, source_doc_id INTEGER NOT NULL, target_doc_id INTEGER NOT NULL,
        relation_type VARCHAR(100) NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS legal_entities (
        id SERIAL PRIMARY KEY, entity_type VARCHAR(50) NOT NULL, name TEXT NOT NULL,
        short_name VARCHAR(100), jurisdiction VARCHAR(50), parent_id INTEGER,
        metadata JSONB, created_at TIMESTAMP DEFAULT now() NOT NULL
      )
    `);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS entity_document_links (
        id SERIAL PRIMARY KEY, entity_id INTEGER NOT NULL, document_id INTEGER NOT NULL,
        relevance_score REAL NOT NULL DEFAULT 1.0
      )
    `);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS verification_log (
      id SERIAL PRIMARY KEY, document_id INTEGER NOT NULL, source_url TEXT,
      http_status INTEGER, reachable BOOLEAN NOT NULL, content_changed BOOLEAN,
      previous_hash VARCHAR(64), new_hash VARCHAR(64),
      verified_at TIMESTAMP DEFAULT now() NOT NULL, note TEXT
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY, session_id VARCHAR(100), action VARCHAR(100) NOT NULL,
      details JSONB, ip_address TEXT, created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY, session_id VARCHAR(100) NOT NULL,
      jurisdiction VARCHAR(50) NOT NULL DEFAULT 'india', language VARCHAR(20) NOT NULL DEFAULT 'en',
      product_category VARCHAR(100), created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY, conversation_id INTEGER NOT NULL, role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL, citations JSONB, confidence INTEGER, agent_trace JSONB,
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS product_classifications (
      id SERIAL PRIMARY KEY, session_id VARCHAR(100) NOT NULL, product_name TEXT,
      product_description TEXT, category VARCHAR(100), is_from_authoritative_text BOOLEAN,
      has_novel_modification BOOLEAN, contains_biological_resource BOOLEAN,
      intended_use VARCHAR(100), classification_result JSONB, ip_recommendations JSONB,
      abs_required BOOLEAN, uncertainty_flags JSONB, created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS escalation_requests (
      id SERIAL PRIMARY KEY, session_id VARCHAR(100) NOT NULL, conversation_id INTEGER,
      reason TEXT NOT NULL, user_query TEXT NOT NULL, contact_email TEXT, contact_phone TEXT,
      status VARCHAR(50) NOT NULL DEFAULT 'pending', created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS organizations (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, slug VARCHAR(100) NOT NULL,
      org_type VARCHAR(50) NOT NULL, sector VARCHAR(100) DEFAULT 'ayurveda',
      description TEXT, contact_email TEXT, contact_phone TEXT, address TEXT,
      gst_number VARCHAR(20), target_markets JSONB, existing_licenses JSONB,
      preferences JSONB, created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS org_members (
      id SERIAL PRIMARY KEY, org_id INTEGER NOT NULL, name TEXT NOT NULL,
      email TEXT NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'member',
      created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS client_products (
      id SERIAL PRIMARY KEY, org_id INTEGER NOT NULL, name TEXT NOT NULL,
      description TEXT, category VARCHAR(100), ingredients JSONB,
      therapeutic_claims TEXT, target_markets JSONB, regulatory_status VARCHAR(100),
      classification_result JSONB, created_at TIMESTAMP DEFAULT now() NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS client_ip_assets (
      id SERIAL PRIMARY KEY, org_id INTEGER NOT NULL, product_id INTEGER,
      ip_type VARCHAR(50) NOT NULL, status VARCHAR(50) NOT NULL, title TEXT NOT NULL,
      application_number VARCHAR(100), registration_number VARCHAR(100),
      filing_date VARCHAR(20), grant_date VARCHAR(20), expiry_date VARCHAR(20),
      jurisdiction VARCHAR(50), notes TEXT, created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS client_documents (
      id SERIAL PRIMARY KEY, org_id INTEGER NOT NULL, product_id INTEGER,
      title TEXT NOT NULL, doc_type VARCHAR(50) NOT NULL, content TEXT NOT NULL,
      tags TEXT, embedding JSONB, created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS client_compliance (
      id SERIAL PRIMARY KEY, org_id INTEGER NOT NULL, product_id INTEGER,
      requirement_type VARCHAR(100) NOT NULL, description TEXT NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending', due_date VARCHAR(20),
      completed_date VARCHAR(20), notes TEXT, created_at TIMESTAMP DEFAULT now() NOT NULL
    )`);

    // Check existing data
    const existing = await db.select({ count: sql<number>`count(*)` }).from(knowledgeDocuments);
    const count = Number(existing[0].count);

    if (count >= knowledgeSeed.length) {
      return NextResponse.json({ message: "Already seeded", count });
    }

    if (count > 0) {
      await db.execute(sql`TRUNCATE knowledge_documents, knowledge_relations, legal_entities, entity_document_links RESTART IDENTITY CASCADE`);
    }

    const insertedIds: number[] = [];
    for (const entry of knowledgeSeed) {
      const searchTokens = [
        entry.title, entry.tags.replace(/,/g, " "),
        entry.citation, entry.category, entry.ipType
      ].join(" ").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
        .filter(w => w.length > 2)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(" ");

      // Generate embedding vector
      const embeddingText = `${entry.title} ${entry.tags} ${entry.content}`;
      const embedding = generateLocalEmbedding(embeddingText);

      // Generate content hash
      const contentHash = crypto.createHash("sha256").update(entry.content).digest("hex");

      const result = await db.insert(knowledgeDocuments).values({
        title: entry.title,
        category: entry.category,
        jurisdiction: entry.jurisdiction,
        ipType: entry.ipType,
        content: entry.content,
        citation: entry.citation,
        sourceUrl: entry.sourceUrl || null,
        version: entry.version || null,
        effectiveDate: entry.effectiveDate || null,
        tags: entry.tags,
        searchTokens,
        embedding,
        contentHash,
        verificationStatus: "unverified",
        authorityLevel: entry.authorityLevel || (
          entry.category === "statute" ? "primary" :
          entry.category === "rule" ? "secondary" :
          entry.category === "treaty" ? "primary" : "tertiary"
        ),
        enactingBody: entry.enactingBody || null,
        isCurrentVersion: true,
      }).returning({ id: knowledgeDocuments.id });
      insertedIds.push(result[0].id);
    }

    // Build knowledge graph relationships
    try {
      const docs = await db.select({
        id: knowledgeDocuments.id,
        ipType: knowledgeDocuments.ipType,
        jurisdiction: knowledgeDocuments.jurisdiction,
        category: knowledgeDocuments.category,
        tags: knowledgeDocuments.tags,
        title: knowledgeDocuments.title,
      }).from(knowledgeDocuments);

      // Build meaningful relationships
      for (let i = 0; i < docs.length; i++) {
        for (let j = i + 1; j < docs.length; j++) {
          const a = docs[i], b = docs[j];
          let relType: string | null = null;
          let desc = "";

          // Same IP type + same jurisdiction = complements
          if (a.ipType === b.ipType && a.jurisdiction === b.jurisdiction) {
            relType = "complements";
            desc = `Related ${a.ipType} provisions in ${a.jurisdiction}`;
          }
          // ABS + patent = references (ABS needed before patent filing)
          else if ((a.ipType === "abs" && b.ipType === "patent") || (a.ipType === "patent" && b.ipType === "abs")) {
            relType = "references";
            desc = "ABS compliance required before IP filing (BD Act Section 6(1))";
          }
          // Regulatory + patent = implements
          else if ((a.ipType === "regulatory" && b.ipType === "patent") || (a.ipType === "patent" && b.ipType === "regulatory")) {
            relType = "implements";
            desc = "Regulatory classification affects patentability assessment";
          }
          // 2023 Amendment references = amends
          else if (a.tags?.includes("2023_amendment") && b.ipType === "abs" && !b.tags?.includes("2023_amendment")) {
            relType = "amends";
            desc = "2023 BD Amendment modifies earlier ABS provisions";
          }
          // Case law references statutes
          else if (a.category === "case_law" && b.category === "statute" && a.ipType === b.ipType) {
            relType = "references";
            desc = "Case law interprets statutory provisions";
          }

          if (relType) {
            await db.insert(knowledgeRelations).values({
              sourceDocId: a.id, targetDocId: b.id,
              relationType: relType, description: desc,
            });
          }
        }
      }

      // Add India vs International potential conflicts
      const indiaPatent = docs.find(d => d.jurisdiction === "india" && d.ipType === "patent" && d.title.includes("3(p)"));
      const intlPatent = docs.find(d => d.jurisdiction === "international" && d.title.includes("Patenting") && d.title.includes("Abroad"));
      if (indiaPatent && intlPatent) {
        await db.insert(knowledgeRelations).values({
          sourceDocId: indiaPatent.id, targetDocId: intlPatent.id,
          relationType: "conflicts_with",
          description: "Section 3(p) bar applies only in India — international patent offices may have different patentability thresholds for TK-based inventions",
        });
      }
    } catch (e) {
      console.error("Relationship building error:", e);
    }

    // Seed legal entities
    try {
      const entities = [
        { entityType: "authority", name: "Indian Patent Office", shortName: "IPO", jurisdiction: "india" },
        { entityType: "authority", name: "National Biodiversity Authority", shortName: "NBA", jurisdiction: "india" },
        { entityType: "authority", name: "CGPDTM", shortName: "CGPDTM", jurisdiction: "india" },
        { entityType: "authority", name: "GI Registry Chennai", shortName: "GI Registry", jurisdiction: "india" },
        { entityType: "authority", name: "FSSAI", shortName: "FSSAI", jurisdiction: "india" },
        { entityType: "authority", name: "CDSCO", shortName: "CDSCO", jurisdiction: "india" },
        { entityType: "authority", name: "WIPO", shortName: "WIPO", jurisdiction: "international" },
        { entityType: "authority", name: "WTO", shortName: "WTO", jurisdiction: "international" },
        { entityType: "product_category", name: "Classical Ayurvedic Medicine", shortName: "classical", jurisdiction: "india" },
        { entityType: "product_category", name: "Proprietary Ayurvedic Medicine", shortName: "proprietary", jurisdiction: "india" },
        { entityType: "product_category", name: "New Ayurvedic Drug", shortName: "new_drug", jurisdiction: "india" },
        { entityType: "product_category", name: "Phytopharmaceutical", shortName: "phytopharma", jurisdiction: "india" },
        { entityType: "product_category", name: "Ayurveda-Aahar", shortName: "nutraceutical", jurisdiction: "india" },
        { entityType: "product_category", name: "Ayurvedic Cosmetic", shortName: "cosmetic", jurisdiction: "india" },
      ];
      for (const ent of entities) {
        await db.insert(legalEntities).values(ent);
      }
    } catch (e) {
      console.error("Entity seeding error:", e);
    }

    return NextResponse.json({ message: "Seeded successfully", count: knowledgeSeed.length, embeddings: insertedIds.length });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}
