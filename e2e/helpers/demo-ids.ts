import fs from 'node:fs';
import path from 'node:path';

export type DemoE2eIds = {
  DEMO_E2E_BRIEF_ID: string;
  DEMO_E2E_PROPERTY_ID: string;
  DEMO_E2E_DEAL_ID: string;
};

export const DEMO_IDS_PATH = path.join(process.cwd(), 'test-results', 'demo-ids.json');

export function writeDemoIds(ids: DemoE2eIds) {
  fs.mkdirSync(path.dirname(DEMO_IDS_PATH), { recursive: true });
  fs.writeFileSync(DEMO_IDS_PATH, JSON.stringify(ids, null, 2));
}

export function readDemoIds(): DemoE2eIds | null {
  try {
    const raw = fs.readFileSync(DEMO_IDS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as DemoE2eIds;
    if (
      parsed.DEMO_E2E_BRIEF_ID &&
      parsed.DEMO_E2E_PROPERTY_ID &&
      parsed.DEMO_E2E_DEAL_ID
    ) {
      return parsed;
    }
  } catch {
    /* file missing or invalid */
  }
  return null;
}

export function resolveDemoIds(): DemoE2eIds | null {
  const fromEnv: DemoE2eIds = {
    DEMO_E2E_BRIEF_ID: process.env.DEMO_E2E_BRIEF_ID ?? '',
    DEMO_E2E_PROPERTY_ID: process.env.DEMO_E2E_PROPERTY_ID ?? '',
    DEMO_E2E_DEAL_ID: process.env.DEMO_E2E_DEAL_ID ?? '',
  };
  if (
    fromEnv.DEMO_E2E_BRIEF_ID &&
    fromEnv.DEMO_E2E_PROPERTY_ID &&
    fromEnv.DEMO_E2E_DEAL_ID
  ) {
    return fromEnv;
  }
  return readDemoIds();
}
