import { MODULE_ID } from "./constants.mjs";
import { getWallet, resolveItemPrice } from "./pricing.mjs";

/** @type {Map<string, (data: object) => void>} */
const pendingPurchase = new Map();

/**
 * v1 rule: transfer the full embedded Item stack (one document) from merchant → buyer.
 * @param {{ requestId: string, merchantId: string, buyerId: string, itemId: string }} payload
 * @param {string} requestingUserId
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function processPurchase(payload, requestingUserId) {
  const merchant = game.actors.get(payload.merchantId);
  const buyer = game.actors.get(payload.buyerId);
  if (!merchant || !buyer) return { ok: false, error: "MERCHANTS.ErrorTransferFailed" };

  const requestingUser = game.users.get(requestingUserId);
  if (!requestingUser) return { ok: false, error: "MERCHANTS.ErrorNotAllowed" };

  if (!requestingUser.isGM) {
    const characterId = requestingUser.character?.id;
    if (!characterId || characterId !== payload.buyerId) {
      if (game.settings?.get(MODULE_ID, "debugGmSocket")) {
        ui.notifications?.warn(
          game.i18n.format("MERCHANTS.GmNotifyInvalidPurchase", { user: requestingUser.name }),
        );
      }
      return { ok: false, error: "MERCHANTS.ErrorNotAllowed" };
    }
  }

  const item = merchant.items.get(payload.itemId);
  if (!item) return { ok: false, error: "MERCHANTS.ErrorItemMissing" };

  const price = resolveItemPrice(item, merchant);
  const wallet = getWallet(buyer);
  if (wallet.gp < price.amount) return { ok: false, error: "MERCHANTS.ErrorInsufficientFunds" };

  const newWallet = { gp: wallet.gp - price.amount };
  const itemData = item.toObject();

  /** @type {Item | undefined} */
  let created;
  try {
    const createdDocs = await buyer.createEmbeddedDocuments("Item", [itemData]);
    created = createdDocs[0];
    await merchant.deleteEmbeddedDocuments("Item", [item.id]);
    await buyer.setFlag(MODULE_ID, "wallet", newWallet);
  } catch (err) {
    console.error(`${MODULE_ID} | purchase failed`, err);
    if (created) {
      try {
        await buyer.deleteEmbeddedDocuments("Item", [created.id]);
      } catch (rollbackErr) {
        console.error(`${MODULE_ID} | rollback failed`, rollbackErr);
      }
    }
    return { ok: false, error: "MERCHANTS.ErrorTransferFailed" };
  }

  return { ok: true };
}

/**
 * @param {object} data
 * @param {string} userId
 */
export function createSocketHandler() {
  return async (data, userId) => {
    if (data?.type === "purchaseResult") {
      if (data.forUserId !== game.user.id) return;
      const resolver = pendingPurchase.get(data.requestId);
      if (resolver) {
        pendingPurchase.delete(data.requestId);
        resolver(data);
      }
      return;
    }

    if (data?.type !== "purchase") return;
    if (!game.user.isGM) return;

    let result;
    try {
      result = await processPurchase(data, userId);
    } catch (err) {
      console.error(`${MODULE_ID} | purchase handler error`, err);
      result = { ok: false, error: "MERCHANTS.ErrorTransferFailed" };
    }

    game.socket.emit(`module.${MODULE_ID}`, {
      type: "purchaseResult",
      requestId: data.requestId,
      forUserId: userId,
      ok: result.ok,
      error: result.error,
    });
  };
}

/**
 * @param {string} requestId
 * @param {(data: object) => void} resolver
 */
export function registerPendingPurchase(requestId, resolver) {
  pendingPurchase.set(requestId, resolver);
}

/**
 * @param {string} requestId
 */
export function cancelPendingPurchase(requestId) {
  pendingPurchase.delete(requestId);
}
