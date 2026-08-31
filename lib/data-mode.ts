export function isDemoMode() {
  return process.env.DEMO_MODE !== 'false' || !process.env.DATABASE_URL;
}
