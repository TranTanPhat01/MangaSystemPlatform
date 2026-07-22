const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export function isValidNonEmptyGuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && GUID_PATTERN.test(value) && value.toLowerCase() !== EMPTY_GUID;
}

export function requireNonEmptyGuid(value: string, field: string) {
  if (!isValidNonEmptyGuid(value)) throw new Error(`${field} must be a non-empty GUID.`);
}
