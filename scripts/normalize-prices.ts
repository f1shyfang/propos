import * as dotenv from "dotenv";
dotenv.config();
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString });
const db = drizzle(pool, { schema });

// Helper to scale a single number based on appraised value
function scaleNumber(num: number, appraisedVal: number | null): number {
  if (num <= 0) return 0;
  if (appraisedVal && appraisedVal > 0) {
    // Include divisors (decimals) as well as multipliers to correct huge values
    const candidates = [
      0.000001, 0.00001, 0.0001, 0.001, 0.01, 0.1,
      1, 10, 100, 1000, 10000, 100000, 1000000
    ];
    let bestScaled = num;
    let minDiff = Infinity;
    for (const mult of candidates) {
      const scaled = Math.round(num * mult);
      const diff = Math.abs(scaled - appraisedVal);
      if (diff < minDiff) {
        minDiff = diff;
        bestScaled = scaled;
      }
    }
    return bestScaled;
  }
  // Fallback if no appraised value
  if (num < 10) return num * 1000000;
  if (num < 100) return num * 100000;
  if (num < 10000) return num * 1000;
  return num;
}

function parsePriceAndDisplay(
  priceVal: number | null,
  displayVal: string | null,
  appraisedVal: number | null
): { price: number | null; priceDisplay: string | null; updated: boolean } {
  // 1. Clean up displayVal if it's the literal string "null", "NULL", "NaN", or just empty spaces
  let cleanDisplay = displayVal ? displayVal.trim() : null;
  if (
    cleanDisplay &&
    (cleanDisplay.toLowerCase() === "null" ||
      cleanDisplay.toLowerCase() === "nan" ||
      cleanDisplay === "")
  ) {
    cleanDisplay = null;
  }

  // Helper to format price in expanded style (e.g. $1,500,000)
  const fmtPrice = (p: number) => {
    return `$${p.toLocaleString("en-AU")}`;
  };

  // Try to parse from priceDisplay if it exists
  if (cleanDisplay) {
    const parts = cleanDisplay.split("-").map((p) => p.trim());
    if (parts.length === 1 || parts.length === 2) {
      let needsFormatting = false;
      const parsedParts = parts.map((part) => {
        const numMatch = part.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
        if (!numMatch) {
          needsFormatting = true;
          return null;
        }
        const val = parseFloat(numMatch[1]);
        const hasM = /m/i.test(part);
        const hasK = /k/i.test(part);

        if (hasM) {
          needsFormatting = true;
          return val * 1000000;
        }
        if (hasK) {
          needsFormatting = true;
          return val * 1000;
        }

        // If it has no suffix and is very small or unreasonably large, it needs formatting & scaling
        if (val < 10000 || (appraisedVal && appraisedVal > 0 && val > 5 * appraisedVal)) {
          needsFormatting = true;
          return scaleNumber(val, appraisedVal);
        }

        return val;
      });

      if (parsedParts.every((p) => p !== null)) {
        let scaledPrices = parsedParts as number[];

        if (scaledPrices.length === 2) {
          let [aScaled, bScaled] = scaledPrices;
          if (aScaled > bScaled) {
            const temp = aScaled;
            aScaled = bScaled;
            bScaled = temp;
          }

          // Adjust aScaled if the ratio is too large (e.g. $300K - $3.2M should be $3M - $3.2M)
          if (aScaled > 0 && bScaled / aScaled > 10) {
            let bestA = aScaled;
            let bestRatio = bScaled / aScaled;
            for (const mult of [10, 100, 1000, 10000]) {
              const candidateA = aScaled * mult;
              if (candidateA <= bScaled) {
                const ratio = bScaled / candidateA;
                if (ratio < bestRatio) {
                  bestRatio = ratio;
                  bestA = candidateA;
                }
              }
            }
            aScaled = bestA;
          }

          scaledPrices = [aScaled, bScaled];
        }

        const avgPrice = Math.round(
          scaledPrices.reduce((a, b) => a + b, 0) / scaledPrices.length
        );

        if (needsFormatting) {
          // If formatting is needed, normalize both price and priceDisplay to expanded style
          const newDisplay = scaledPrices.map(fmtPrice).join(" - ");
          const isChanged = priceVal !== avgPrice || displayVal !== newDisplay;
          return {
            price: avgPrice,
            priceDisplay: newDisplay,
            updated: isChanged,
          };
        } else {
          // Check if the current displayVal is not in expanded format (e.g. has K or M or is not matching our formatted string)
          const expectedDisplay = scaledPrices.map(fmtPrice).join(" - ");
          const isNotExpanded = cleanDisplay !== expectedDisplay;
          
          if (isNotExpanded) {
            const isChanged = priceVal !== avgPrice || displayVal !== expectedDisplay;
            return {
              price: avgPrice,
              priceDisplay: expectedDisplay,
              updated: isChanged,
            };
          }

          const isChanged = priceVal !== avgPrice || displayVal !== cleanDisplay;
          return {
            price: avgPrice,
            priceDisplay: cleanDisplay,
            updated: isChanged,
          };
        }
      }
    }
  }

  // If we couldn't parse a valid price from displayVal, or displayVal is empty, let's check priceVal
  if (priceVal && priceVal > 0) {
    // If the price is already a realistic property price (>= 100,000)
    // AND is not unreasonably high compared to appraisedValue
    if (priceVal >= 100000 && (!appraisedVal || appraisedVal <= 0 || priceVal <= 5 * appraisedVal)) {
      const expectedDisplay = fmtPrice(priceVal);
      const isNotExpanded = cleanDisplay !== expectedDisplay;
      
      return {
        price: priceVal,
        priceDisplay: expectedDisplay,
        updated: isNotExpanded,
      };
    }

    // Scale priceVal using appraised value
    const normalizedPrice = scaleNumber(priceVal, appraisedVal);
    const newDisplay = fmtPrice(normalizedPrice);

    const isChanged = priceVal !== normalizedPrice || displayVal !== newDisplay;
    return {
      price: normalizedPrice,
      priceDisplay: newDisplay,
      updated: isChanged,
    };
  }

  // If price is 0 or null, set display to null if it was corrupted
  const isChanged = priceVal !== 0 || displayVal !== cleanDisplay;
  return {
    price: 0,
    priceDisplay: cleanDisplay,
    updated: isChanged,
  };
}

async function main() {
  const commit = process.argv.includes("--commit");
  console.log(`Running price normalization... Mode: ${commit ? "COMMIT" : "DRY RUN (pass --commit to save changes)"}`);

  const CHUNK_SIZE = 1000;
  let offset = 0;
  let totalChecked = 0;
  let totalUpdated = 0;

  const sampleChanges: any[] = [];

  while (true) {
    const properties = await db.select({
      id: schema.propertiesTable.id,
      address: schema.propertiesTable.address,
      suburb: schema.propertiesTable.suburb,
      price: schema.propertiesTable.price,
      priceDisplay: schema.propertiesTable.priceDisplay,
      appraisedValue: schema.propertiesTable.appraisedValue,
    }).from(schema.propertiesTable)
      .offset(offset)
      .limit(CHUNK_SIZE);

    if (properties.length === 0) break;

    const updates: Promise<any>[] = [];

    for (const prop of properties) {
      const { price: newPrice, priceDisplay: newDisplay, updated } = parsePriceAndDisplay(
        prop.price,
        prop.priceDisplay,
        prop.appraisedValue
      );

      if (updated) {
        totalUpdated++;
        if (sampleChanges.length < 50) {
          sampleChanges.push({
            id: prop.id,
            address: prop.address,
            suburb: prop.suburb,
            old: { price: prop.price, display: prop.priceDisplay, appraised: prop.appraisedValue },
            new: { price: newPrice, display: newDisplay },
          });
        }

        if (commit) {
          updates.push(
            db.update(schema.propertiesTable)
              .set({ price: newPrice, priceDisplay: newDisplay })
              .where(eq(schema.propertiesTable.id, prop.id))
          );
        }
      }
    }

    if (commit && updates.length > 0) {
      await Promise.all(updates);
    }

    totalChecked += properties.length;
    offset += CHUNK_SIZE;
    process.stdout.write(`\rProcessed ${totalChecked} properties...`);
  }

  console.log(`\n\nNormalization Stats:`);
  console.log(`Total properties checked: ${totalChecked}`);
  console.log(`Total properties requiring updates: ${totalUpdated}`);

  console.log("\nSample changes:");
  for (const item of sampleChanges) {
    console.log(`- Suburb: ${item.suburb} | Address: ${item.address}`);
    console.log(`  BEFORE: Price = ${item.old.price}, Display = "${item.old.display}", Appraised = ${item.old.appraised}`);
    console.log(`  AFTER : Price = ${item.new.price}, Display = "${item.new.display}"`);
  }

  await pool.end().catch(() => {});
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
