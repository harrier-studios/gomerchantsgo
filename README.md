# Go Merchant Go
Go Merchant Go (GMG) is a lightning fast, offline, vendor creation tool for Paizo's Pathfinder 2nd Edition that removes the need to spend your precious time poring through multiple sources to find interesting and relevant items for your players to derail your game with. Paizo's 5600+ item catalog is already included. That means you'll find old classics like, "Longsword," and "Lesser Healing Potion," plus a ton of kit you didn't even know existed.

You can use Go Merchant Go as part of your pre-session planning, or on the fly. It's dead simple to use and crazy fast, and again, it comes with the entire Pathfinder 2nd Edition item catalog built in; no more importing items yourself to make your merchant app work. You can even modify existing items, or create your own from scratch.

# Features
- Multiple variables to tweak (or not) to impact a merchant's final inventory:
      settlement size, economy, ancestry, item types, rarity and more...
- Leverages Paizo's builtin Trait system for tagging, and you can add your own.
- Save, Import, and Export merchants and custom items for backup and sharing.
- No dependencies. No logins. No pestering for updates. GMG is ready to work when you are.
- GMG will not pester you for updates, but can be updated with the click of a button.


# Installation
Download the zip file, extract it where you like, and you're ready to go.
Go Merchant Go's only dependency is the web browser you're already using.


# Running
Open index.html. That's it. Go Merchant Go runs right in your browser.


# Operation
When you open Go Merchant Go, you'll be faced with a simple screen: Merchants, Custom Data,
and Settings. Clicking any of these will take you to their relevant screens.

# Merchants
In here you'll see a list of any merchants you've already saved, and at the top right is the New Merchant button.

The next screen is the meat of GMG. Here, you'll customize your merchant with a name, determine
what kind of settlement they're in: size of the settlement, and its economy.
Then you'll select some variables for the Merchant: Ancestry, Store Type, and Stocking Style.
After that, you can tweak the stock: Arcane Tilt, Pricing Modifier, Item Rarity.
Lastly, can further fine-tune your new Merchant with additional filters (tags).

When you're done, hit Generate in the top right (that'll be a theme here).

The next screen will show you your merchant, their inventory, and how much money they have on hand (if you care about that). From here you can either Regenerate the merchant using your previous parameters, save it, or go Back and start over.

# Custom Data
Clicking this will immediately take you to a list of any previously saved or imported items where you can further edit them, or delete them entirely.

The bread and butter here are the Create from Existing and New Item buttons. New Item is exactly what you expect: create a brand new item from scratch. Create from Existing is how you modify existing items. Clicking that will take you to a screen where you can filter and search the item catalog to find exactly what you're looking for.

The neat bit? This is all non-destructive. Modifying an existing item will not overwrite the original. This means if you delete the modified item later, the original item persists in the catalog. There are only two ways a published item goes missing from the catalog: Paizo removes it. You edit the catalog and remove it yourself.

# Settings
The Light/Dark/System mode toggle is here along with all your Import and Export options.
Of note, you can customize your defaults for creating Merchants. Playing in a low magic game? Drag the Arcane Tilt slider down, save it, and all your future merchants will default to that lower setting. Think your players have too much gold? Drag the Pricing Modifer up and increase the cost of everything another 50%. Your game centers on exploration and your players rarely make it to busy trading hubs? Set the Economy to Frontier and GMG will fill your merchant with appropriate items for merchants working on tight budgets with few craftspeople to purchase stock from. When you're done, hit Save Defaults in the top right.

# Data
All items and merchants are stored in various .JSON files. Clicking Update will connect to GMG's Github (https://github.com/codeguy1134/merchants/settings), and update items.json. This file is where all the published items are collected.

The Import/Export buttons will import or export their respective targets: merchants, or custom items.

# IMPORTANT: GO MERCHANT GO STORES ALL OF YOUR CUSTOM DATA IN YOUR BROWSER! # 
All of your Merchants and custom items are stored locally in your browser (localStorage). **Clearing your browser's cache, cookies, or site data — or hitting the Reset button — will DELETE your stored data. This CANNOT be undone.** To avoid loss, export your data using the Export buttons.

# Power Users

As mentioned earlier, everything is stored in .JSON files. If you know what you're doing and
can get around a text editor, you can edit these files directly. Just be aware, that items.json is **dense** and any changes you make to it **will** be overwritten the next time you update GMG.

It is not recommended to create new items directly in the .JSON files, as they are assigned a
Universally Unique IDentifier (UUID) by the app at creation. This UUID prevents conflicts if two items have the same name. With over 5600 published items in the catalog, this is an important safety feature to keep GMG running smoothly. If you insist, there are UUID generators online. I highly recommend creating UUIDs for your items and adding them to the appropriate headings.
