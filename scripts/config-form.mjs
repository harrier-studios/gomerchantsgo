import { MODULE_ID } from "./constants.mjs";

export class MerchantConfigForm extends FormApplication {
  /** @param {Actor} actor */
  constructor(actor, options = {}) {
    super(actor, options);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["merchants", "merchants-config"],
      template: `modules/${MODULE_ID}/templates/merchant-config.hbs`,
      width: 440,
      height: "auto",
      closeOnSubmit: true,
    });
  }

  get title() {
    return game.i18n.localize("MERCHANTS.ConfigTitle");
  }

  getData() {
    const merchant = foundry.utils.mergeObject(
      { enabled: false, welcomeMessage: "", defaultPrice: 0 },
      this.object.getFlag(MODULE_ID, "merchant") || {},
    );
    return { merchant };
  }

  /**
   * @param {Event} event
   * @param {object} formData
   */
  async _updateObject(event, formData) {
    const enabled = Boolean(formData.enabled);
    const welcomeMessage = String(formData.welcomeMessage ?? "");
    const defaultPrice = Math.max(0, Number(formData.defaultPrice) || 0);
    await this.object.setFlag(MODULE_ID, "merchant", { enabled, welcomeMessage, defaultPrice });
  }
}
