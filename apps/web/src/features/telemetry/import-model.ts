export function parseObservationImport(input: string): unknown[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error('Observation import must contain valid JSON.');
  }

  if (!Array.isArray(parsed)) throw new Error('Observation import must be a JSON array.');
  if (parsed.length > 5000) throw new Error('Observation import cannot exceed 5,000 entries.');
  return parsed;
}
