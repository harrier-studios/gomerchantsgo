(function () {
  "use strict";

  var cfg = window.MerchantApp.config;

  function el(id) {
    return document.getElementById(id);
  }

  function fillSelect(selectId, list, valueKey, labelKey) {
    var s = el(selectId);
    if (!s) return;
    s.innerHTML = "";
    for (var i = 0; i < list.length; i++) {
      var o = document.createElement("option");
      o.value = list[i][valueKey];
      o.textContent = list[i][labelKey];
      s.appendChild(o);
    }
  }

  function formatGp(n) {
    if (n >= 1000 && n % 1 === 0) return n.toLocaleString() + " gp";
    var rounded = Math.round(n * 100) / 100;
    return rounded.toLocaleString(undefined, { maximumFractionDigits: 2 }) + " gp";
  }

  function render(result) {
    var tbody = el("inventoryBody");
    var meta = el("inventoryMeta");
    var empty = el("emptyState");
    tbody.innerHTML = "";

    if (!result.lines.length) {
      empty.hidden = false;
      meta.textContent = result.meta && result.meta.note ? result.meta.note : "Adjust parameters and generate again.";
      el("totalSku").textContent = "0";
      el("totalGp").textContent = formatGp(0);
      return;
    }

    empty.hidden = true;
    var m = result.meta || {};
    meta.innerHTML =
      "<strong>" +
      (m.store || "") +
      "</strong> · " +
      (m.location || "") +
      " · " +
      (m.race || "") +
      " · " +
      (m.wealth || "") +
      " · " +
      (m.demand || "") +
      " · " +
      (m.arcane || "") +
      "<br>Budget " +
      formatGp(m.budgetGp || 0) +
      " · Stocked " +
      formatGp(m.spentGp || 0) +
      " · Max item level " +
      (m.maxItemLevel != null ? m.maxItemLevel : "—") +
      (m.seedHint ? " · Seed <code>" + escapeHtml(String(m.seedHint)) + "</code>" : "");

    for (var i = 0; i < result.lines.length; i++) {
      var row = result.lines[i];
      var tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" +
        escapeHtml(row.name) +
        "</td>" +
        "<td class=\"num\">" +
        row.qty +
        "</td>" +
        "<td class=\"num\">" +
        formatGp(row.unitPriceGp) +
        "</td>" +
        "<td class=\"num\">" +
        formatGp(row.lineTotalGp) +
        "</td>" +
        "<td class=\"num\">" +
        row.level +
        "</td>" +
        "<td><span class=\"rarity rarity-" +
        escapeHtml(row.rarity) +
        "\">" +
        escapeHtml(row.rarity) +
        "</span></td>" +
        "<td>" +
        (row.bulk ? escapeHtml(row.bulk) : "—") +
        "</td>";
      tbody.appendChild(tr);
    }

    el("totalSku").textContent = String(result.totals.skuCount);
    el("totalGp").textContent = formatGp(result.totals.listPriceGp);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readParams() {
    return {
      locationId: el("paramLocation").value,
      raceId: el("paramRace").value,
      storeId: el("paramStore").value,
      wealthId: el("paramWealth").value,
      settlementId: el("paramSettlement").value,
      reputationId: el("paramReputation").value,
      stockPolicy: el("paramStock").value,
      rarityMode: el("paramRarity").value,
      marketDemandId: el("paramDemand").value,
      arcaneTiltId: el("paramArcane").value,
      seed: el("paramSeed").value.trim(),
    };
  }

  function run() {
    var result = window.MerchantApp.generateInventory(readParams());
    render(result);
  }

  function init() {
    fillSelect("paramLocation", cfg.locations, "id", "label");
    fillSelect("paramRace", cfg.merchantRaces, "id", "label");
    fillSelect("paramStore", cfg.storeTypes, "id", "label");
    fillSelect("paramWealth", cfg.wealthTiers, "id", "label");
    fillSelect("paramSettlement", cfg.settlementSizes, "id", "label");
    fillSelect("paramReputation", cfg.reputations, "id", "label");
    fillSelect("paramStock", cfg.stockPolicies, "id", "label");
    fillSelect("paramRarity", cfg.itemRaritiesAllowed, "id", "label");
    fillSelect("paramDemand", cfg.marketDemand, "id", "label");
    fillSelect("paramArcane", cfg.arcaneTilt, "id", "label");

    el("btnGenerate").addEventListener("click", run);
    el("btnRandomSeed").addEventListener("click", function () {
      el("paramSeed").value = Math.random().toString(36).slice(2, 10);
      run();
    });

    run();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
