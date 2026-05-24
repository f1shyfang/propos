import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool, { schema });

async function seed() {
  const users = await db.select().from(schema.user).where(eq(schema.user.email, "sarah@demo.com"));
  if (users.length === 0) return console.log("Sarah not found");
  const sarah = users[0];

  const agents = await db.select().from(schema.user).where(eq(schema.user.email, "agent@demo.com"));
  if (agents.length === 0) return console.log("Agent not found");
  const agent = agents[0];

  // See if Sarah has a brief
  let briefs = await db.select().from(schema.buyerBriefsTable).where(eq(schema.buyerBriefsTable.clientUserId, sarah.id));
  if (briefs.length === 0) {
    console.log("Creating brief for Sarah...");
    briefs = await db.insert(schema.buyerBriefsTable).values({
      clientName: "Sarah Chen",
      email: "sarah@demo.com",
      phone: "0400000000",
      status: "active",
      clientUserId: sarah.id,
      agentId: agent.id,
      regions: ["Bayside", "South East"],
      propertyTypes: ["house"],
      budgetMin: 800000,
      budgetMax: 1200000,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 1,
      dealType: "purchase",
      ownerOccupier: true,
      notes: "Looking for a nice family home.",
    }).returning();
  }

  const brief = briefs[0];

  // Make sure there is a property
  let props = await db.select().from(schema.propertiesTable).limit(1);
  if (props.length === 0) {
     console.log("Creating property...");
     props = await db.insert(schema.propertiesTable).values({
        address: "123 Main St",
        suburb: "Brighton",
        state: "VIC",
        postcode: "3186",
        price: 1000000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: "house",
        overallScore: 85
     }).returning();
  }
  const prop = props[0];

  // Ensure it is shortlisted
  const shortlists = await db.select().from(schema.shortlistsTable).where(eq(schema.shortlistsTable.briefId, brief.id));
  if (shortlists.length === 0) {
    console.log("Creating shortlist...");
    await db.insert(schema.shortlistsTable).values({
      briefId: brief.id,
      propertyId: prop.id,
      status: "shortlisted",
      feedbackStatus: "new"
    });
  }

  console.log("Done seeding for E2E.");
  process.exit(0);
}

seed();
