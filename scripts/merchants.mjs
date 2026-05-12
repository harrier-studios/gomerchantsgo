import { MODULE_ID } from "./constants.mjs";
import { MerchantConfigForm } from "./config-form.mjs";
import { MerchantShopApp } from "./shop-app.mjs";
import { createSocketHandler } from "./socket-handler.mjs";

/**
 * @param {string | Actor} merchantIdOrActor
 * @param {{ buyerId?: string }} [options]
 * @returns {MerchantShopApp | null}
 */
function openShop(merchantIdOrActor, options = {}) {
  const actor =
    typeof merchantIdOrActor === "string"
      ? game.actors.get(merchantIdOrActor)
      : merchantIdOrActor;

  if (!actor) {
    ui.notifications.warn(game.i18n.localize("MERCHANTS.ActorNotFound"));
    return null;
  }

  const merchantOpen = actor.getFlag(MODULE_ID, "merchant")?.enabled;
  if (!game.user.isGM && !merchantOpen) {
    ui.notifications.warn(game.i18n.localize("MERCHANTS.MerchantDisabled"));
    return null;
  }

  const app = new MerchantShopApp(actor, { buyerId: options.buyerId });
  app.render(true);
  return app;
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "debugGmSocket", {
    name: "Merchants: notify GM on blocked purchases",
    hint: "When enabled, the GM sees a warning when a player attempts an invalid purchase (wrong buyer, etc.).",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
});

Hooks.once("ready", () => {
  game.socket.on(`module.${MODULE_ID}`, createSocketHandler());

  game.merchants = {
    MODULE_ID,
    openShop,
  };
});

Hooks.on("getActorSheetHeaderButtons", (sheet, buttons) => {
  const actor = sheet.actor;
  if (!actor) return;

  buttons.unshift({
    label: game.i18n.localize("MERCHANTS.OpenShop"),
    class: "open-merchant-shop",
    icon: "fas fa-store",
    onclick: () => {
      openShop(actor.id);
    },
  });

  if (game.user.isGM) {
    buttons.unshift({
      label: game.i18n.localize("MERCHANTS.ConfigureMerchant"),
      class: "configure-merchant",
      icon: "fas fa-cog",
      onclick: () => {
        new MerchantConfigForm(actor).render(true);
      },
    });
  }
});
