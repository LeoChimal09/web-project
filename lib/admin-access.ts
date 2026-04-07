export function isAdminModeEnabled() {
  return process.env.ADMIN_TEST_MODE === "true";
}