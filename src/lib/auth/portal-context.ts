import "server-only";
import { getCurrentUser } from "./session";

/**
 * Resolves which buyer the portal renders for. A buyer-role user always sees
 * their own company. Any other role (e.g. an admin who clicked "View as
 * Buyer" from Order 360, brief §57) previews the demo buyer's portal —
 * this never grants a non-buyer access to another buyer's data through the
 * real auth path, it's a read-only demo lens layered on top of the mock
 * session described in AGENTS.md §4.
 */
const DEMO_BUYER_ID = "buyer-01";

export async function resolvePortalBuyerId(): Promise<string> {
  const user = await getCurrentUser();
  return user.role === "buyer" && user.buyerId ? user.buyerId : DEMO_BUYER_ID;
}

const DEMO_FACTORY_ID = "factory-02";

export async function resolvePortalFactoryId(): Promise<string> {
  const user = await getCurrentUser();
  return user.role === "factory_partner" && user.factoryId ? user.factoryId : DEMO_FACTORY_ID;
}
