import { MODULE_ID } from "./constants.mjs";
import { getWallet, resolveItemPrice } from "./pricing.mjs";
import {
  cancelPendingPurchase,
  registerPendingPurchase,
} from "./socket-handler.mjs";

export class MerchantShopApp extends Application {
  /** @param {Actor} merchantActor */
  constructor(merchantActor, options = {}) {
    const defaultBuyer =
      options.buyerId ??
      game.user.character?.id ??
      (game.user.isGM ? game.actors.find((a) => a.type === "character")?.id : null);

    super(
      foundry.utils.mergeObject(
        {
          id: `merchants-shop-${merchantActor.id}`,
          template: `modules/${MODULE_ID}/templates/merchant-shop.hbs`,
          width: 560,
          resizable: true,
          classes: ["merchants", "merchants-shop"],
        },
        options,
      ),
    );

    this.merchantActor = merchantActor;
    this._buyerId = defaultBuyer;
  }

  get title() {
    return game.i18n.format("MERCHANTS.ShopTitle", { name: this.merchantActor.name });
  }

  getData() {
    const merchantData = this.merchantActor.getFlag(MODULE_ID, "merchant") || {};
    const welcomeMessage = merchantData.welcomeMessage || "";
    const isGm = game.user.isGM;
    const showBuyerSelect = isGm;

    let errorKey = null;
    if (!isGm && !merchantData.enabled) errorKey = "MERCHANTS.MerchantDisabled";
    else if (!isGm && !game.user.character) errorKey = "MERCHANTS.NoCharacter";
    else if (!this._buyerId) errorKey = "MERCHANTS.ErrorNoBuyer";

    const buyerOptions = showBuyerSelect
      ? game.actors
          .filter((a) => a.type === "character")
          .map((a) => ({
            id: a.id,
            label: a.name,
            selected: a.id === this._buyerId,
          }))
          .sort((a, b) => a.label.localeCompare(b.label))
      : [];

    if (showBuyerSelect && !buyerOptions.length) errorKey = "MERCHANTS.ErrorNoBuyer";

    const buyer = this._buyerId ? game.actors.get(this._buyerId) : null;
    const wallet = buyer ? getWallet(buyer) : { gp: 0 };
    const walletDisplay = String(wallet.gp);

    const items = this.merchantActor.items.map((item) => ({
      id: item.id,
      name: item.name,
      priceDisplay: `${resolveItemPrice(item, this.merchantActor).amount} ${game.i18n.localize("MERCHANTS.Gp")}`,
    }));

    const canBuy = !errorKey;

    return {
      welcomeMessage,
      showBuyerSelect,
      buyerOptions,
      walletDisplay,
      items,
      canBuy,
      errorKey,
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('[data-action="set-buyer"]').on("change", this._onChangeBuyer.bind(this));
    html.find('[data-action="buy"]').on("click", this._onBuy.bind(this));
  }

  /** @param {Event} event */
  _onChangeBuyer(event) {
    const value = /** @type {HTMLSelectElement} */ (event.currentTarget).value;
    this._buyerId = value || null;
    this.render(false);
  }

  /** @param {Event} event */
  async _onBuy(event) {
    event.preventDefault();
    const itemId = /** @type {HTMLElement} */ (event.currentTarget).dataset.itemId;
    if (!itemId || !this._buyerId) return;

    const activeGm = game.users.find((u) => u.isGM && u.active);
    if (!activeGm) {
      ui.notifications.warn(game.i18n.localize("MERCHANTS.ErrorNoGm"));
      return;
    }

    const requestId = foundry.utils.randomID();
    ui.notifications.info(game.i18n.localize("MERCHANTS.PurchasePending"));

    const result = await new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        cancelPendingPurchase(requestId);
        resolve({ ok: false, error: "MERCHANTS.ErrorTimeout" });
      }, 30000);

      registerPendingPurchase(requestId, (data) => {
        window.clearTimeout(timeout);
        resolve({ ok: Boolean(data.ok), error: data.error });
      });

      game.socket.emit(`module.${MODULE_ID}`, {
        type: "purchase",
        requestId,
        merchantId: this.merchantActor.id,
        buyerId: this._buyerId,
        itemId,
      });
    });

    if (result.ok) ui.notifications.info(game.i18n.localize("MERCHANTS.PurchaseSuccess"));
    else if (result.error) ui.notifications.warn(game.i18n.localize(result.error));

    this.render(true);
  }
}
