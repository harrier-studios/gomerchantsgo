import { MODULE_ID } from "./constants.mjs";

/** v1: prices and wallet are in gold pieces (gp) only — system-agnostic flags. */
export const DEFAULT_CURRENCY = "gp";

/**
 * @param {Actor} actor
 * @returns {{ gp: number }}
 */
export function getWallet(actor) {
  const raw = actor.getFlag(MODULE_ID, "wallet") || {};
  const gp = Math.max(0, Number(raw.gp) || 0);
  return { gp };
}

/**
 * @param {Item} item
 * @param {Actor} merchant
 * @returns {{ amount: number, currency: string }}
 */
export function resolveItemPrice(item, merchant) {
  const itemPrice = item.getFlag(MODULE_ID, "price");
  if (itemPrice && typeof itemPrice.amount === "number" && itemPrice.amount >= 0) {
    return {
      amount: itemPrice.amount,
      currency: itemPrice.currency || DEFAULT_CURRENCY,
    };
  }
  const m = merchant.getFlag(MODULE_ID, "merchant") || {};
  const def = m.defaultPrice;
  if (typeof def === "number" && def >= 0) {
    return { amount: def, currency: DEFAULT_CURRENCY };
  }
  return { amount: 0, currency: DEFAULT_CURRENCY };
}
