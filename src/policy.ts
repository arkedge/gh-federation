export type Claims = { [name: string]: string | number | boolean | string[] };

export function authorize(_claims: Claims): boolean {
  return false;
}
