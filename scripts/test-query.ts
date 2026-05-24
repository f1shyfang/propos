import * as dotenv from "dotenv";
dotenv.config();

// Helper to scale a single number based on appraised value
function scaleNumber(num: number, appraisedVal: number | null): number {
  if (num <= 0) return 0;
  if (appraisedVal && appraisedVal > 0) {
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
  return num;
}

function parsePriceAndDisplay(
  priceVal: number | null,
  displayVal: string | null,
  appraisedVal: number | null
): { price: number | null; priceDisplay: string | null; updated: boolean } {
  let cleanDisplay = displayVal ? displayVal.trim() : null;
  if (
    cleanDisplay &&
    (cleanDisplay.toLowerCase() === "null" ||
      cleanDisplay.toLowerCase() === "nan" ||
      cleanDisplay === "")
  ) {
    cleanDisplay = null;
  }

  const fmtPrice = (p: number) => {
    return `$${p.toLocaleString("en-AU")}`;
  };

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
          const newDisplay = scaledPrices.map(fmtPrice).join(" - ");
          const isChanged = priceVal !== avgPrice || displayVal !== newDisplay;
          return {
            price: avgPrice,
            priceDisplay: newDisplay,
            updated: isChanged,
          };
        } else {
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

  if (priceVal && priceVal > 0) {
    if (priceVal >= 100000 && (!appraisedVal || appraisedVal <= 0 || priceVal <= 5 * appraisedVal)) {
      const expectedDisplay = fmtPrice(priceVal);
      const isNotExpanded = cleanDisplay !== expectedDisplay;
      
      return {
        price: priceVal,
        priceDisplay: expectedDisplay,
        updated: isNotExpanded,
      };
    }

    const normalizedPrice = scaleNumber(priceVal, appraisedVal);
    const newDisplay = fmtPrice(normalizedPrice);

    const isChanged = priceVal !== normalizedPrice || displayVal !== newDisplay;
    return {
      price: normalizedPrice,
      priceDisplay: newDisplay,
      updated: isChanged,
    };
  }

  const isChanged = priceVal !== 0 || displayVal !== cleanDisplay;
  return {
    price: 0,
    priceDisplay: cleanDisplay,
    updated: isChanged,
  };
}

console.log("6 Herrick Street:", parsePriceAndDisplay(451627488, null, 1375000));
console.log("185 Dawn Street:", parsePriceAndDisplay(1050500, "$626K - $1.48M", 1650000));
