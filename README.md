# merchants

Foundry VTT **v13** module: turn an actor’s inventory into a simple shop with GM configuration, a buy window, and **server-side (GM) purchase validation** over sockets.

## Install (development)

1. Clone this repo (or copy the folder) into your Foundry user data: `Data/modules/merchants` (the folder name must match the `id` in `module.json`).
2. In Foundry, enable the **Merchants** module under **Manage Modules**.

## Quick use

1. As GM, open an actor (loot/container or any actor with items). Use **Configure merchant** on the sheet header to enable the shop and set a default price in **gp** (optional welcome text).
2. Add items to that actor. Optionally set per-item price: on an item, set the module flag `price` to `{ "amount": 5 }` (gold pieces); otherwise the actor’s default price applies (0 gp is free).
3. Set buyer funds: on the **buyer** character actor, set module flag `wallet` to `{ "gp": 10 }` (or adjust in the **Token** / actor data if you use a UI that edits flags).
4. **Open shop** from the actor sheet (players only see the button meaningfully when the merchant is enabled; the GM can always preview).
5. Purchases require an **active GM** online; the GM client runs validation and moves the item + deducts gold.

From a macro or the console: `game.merchants.openShop(actorIdOrActor, { buyerId: optionalId })`.
