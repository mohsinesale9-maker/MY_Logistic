import moment from "moment";

export const logisticsMath = {
  // ═══════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════
  chiffreAffaires: (orders) =>
    orders.reduce((s, o) => s + (o.total || 0), 0),
  benefice: (ca, depenses) => ca - depenses,
  croissance: (caN, caN1) => (caN1 > 0 ? ((caN - caN1) / caN1) * 100 : 0),
  tauxRealisation: (atteint, objectif) =>
    objectif > 0 ? (atteint / objectif) * 100 : 0,

  // ═══════════════════════════════════════════════════
  // EXPLOITATION & TRANSPORT
  // ═══════════════════════════════════════════════════
  missionCompletionRate: (completed, planned) =>
    planned > 0 ? (completed / planned) * 100 : 0,
  deliveryRate: (delivered, planned) =>
    planned > 0 ? (delivered / planned) * 100 : 0,
  transportRevenue: (transports) =>
    transports.reduce((s, t) => s + (t.cout_transport || 0), 0),
  transportCost: (fuel, driverSalary, maintenance, toll, subcontracting, other) =>
    (fuel || 0) + (driverSalary || 0) + (maintenance || 0) + (toll || 0) + (subcontracting || 0) + (other || 0),
  transportMargin: (revenue, cost) => revenue - cost,
  missionProfitability: (revenue, cost) =>
    revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0,
  missionCost: (fuel, driverSalary, toll, maintenance, otherCosts) =>
    (fuel || 0) + (driverSalary || 0) + (toll || 0) + (maintenance || 0) + (otherCosts || 0),
  missionMargin: (revenue, cost) => revenue - cost,
  pricePerKm: (revenue, distance) => (distance > 0 ? revenue / distance : 0),
  costPerKm: (cost, distance) => (distance > 0 ? cost / distance : 0),
  fleetAvailability: (available, total) => (total > 0 ? (available / total) * 100 : 0),
  fleetUtilization: (inMission, total) => (total > 0 ? (inMission / total) * 100 : 0),
  fleetImmobilization: (unavailable, total) => (total > 0 ? (unavailable / total) * 100 : 0),
  fuelConsumption: (litres, distance) =>
    distance > 0 ? (litres / distance) * 100 : 0,
  fuelCost: (litres, price) => (litres || 0) * (price || 0),
  overConsumption: (actual, standard) => Math.max(0, (actual || 0) - (standard || 0)),
  overConsumptionRate: (actual, standard) =>
    standard > 0 ? ((actual - standard) / standard) * 100 : 0,
  vehicleAvailability: (availableTime, totalTime) =>
    totalTime > 0 ? (availableTime / totalTime) * 100 : 0,
  remainingDays: (expirationDate) =>
    expirationDate ? Math.ceil((new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0,
  fleetAlerts: (fleet) => {
    const alerts = [];
    fleet.forEach((v) => {
      const insDays = logisticsMath.remainingDays(v.assurance_date_fin);
      if (insDays <= 30 && insDays >= 0) alerts.push({ vehicle: v.matricule, type: "Assurance", days: insDays });
      const vtDays = logisticsMath.remainingDays(v.visite_technique_prochaine);
      if (vtDays <= 30 && vtDays >= 0) alerts.push({ vehicle: v.matricule, type: "Visite technique", days: vtDays });
    });
    return alerts;
  },

  // ═══════════════════════════════════════════════════
  // STOCKS & INVENTORY
  // ═══════════════════════════════════════════════════
  stockDisponible: (physique, reserve) => (physique || 0) - (reserve || 0),
  stockSecurite: (z, sigma, leadTime) =>
    (z || 0) * (sigma || 0) * Math.sqrt(leadTime || 0),
  pointCommande: (consommation, leadTime, stockSecurite) =>
    (consommation || 0) * (leadTime || 0) + (stockSecurite || 0),
  eoq: (demande, coutCommande, coutStockage) =>
    coutStockage > 0 ? Math.sqrt((2 * (demande || 0) * (coutCommande || 0)) / coutStockage) : 0,
  rotation: (consommation, stockMoyen) =>
    stockMoyen > 0 ? consommation / stockMoyen : 0,
  couverture: (stockDisponible, consommation) =>
    consommation > 0 ? stockDisponible / consommation : 0,
  valeurStock: (articles) =>
    articles.reduce((s, a) => s + (a.stock_physique || 0) * (a.cout_unitaire || 0), 0),
  inventoryValue: (quantity, avgCost) => (quantity || 0) * (avgCost || 0),
  inventoryTurnover: (consumption, avgInventory) =>
    avgInventory > 0 ? consumption / avgInventory : 0,
  weightedAverageCost: (totalValue, totalQty) =>
    totalQty > 0 ? totalValue / totalQty : 0,

  // ═══════════════════════════════════════════════════
  // PURCHASING & SUPPLIERS
  // ═══════════════════════════════════════════════════
  tauxService: (livrees, total) => (total > 0 ? (livrees / total) * 100 : 0),
  otd: (dansDelai, total) => (total > 0 ? (dansDelai / total) * 100 : 0),
  cmp: (valeurTotale, quantite) => (quantite > 0 ? valeurTotale / quantite : 0),
  ecartAchat: (prixReel, prixPrevu) => (prixReel || 0) - (prixPrevu || 0),
  supplierScore: (respectDelais, qualite, prix, reactivite) =>
    0.4 * (respectDelais || 0) + 0.3 * (qualite || 0) + 0.2 * (prix || 0) + 0.1 * (reactivite || 0),
  supplierDeliveryRate: (commandesLivrees, totalCommandes) =>
    totalCommandes > 0 ? (commandesLivrees / totalCommandes) * 100 : 0,
  purchaseGrowth: (current, previous) =>
    previous > 0 ? ((current - previous) / previous) * 100 : 0,

  // ═══════════════════════════════════════════════════
  // WMS
  // ═══════════════════════════════════════════════════
  occupation: (utilise, total) => (total > 0 ? (utilise / total) * 100 : 0),
  exactitudeInventaire: (corrects, controles) =>
    controles > 0 ? (corrects / controles) * 100 : 0,

  // ═══════════════════════════════════════════════════
  // TRANSPORT (Legacy compat)
  // ═══════════════════════════════════════════════════
  coutKm: (cout, distance) => (distance > 0 ? cout / distance : 0),
  consommation: (litres, distance) => (distance > 0 ? (litres / distance) * 100 : 0),
  otif: (completesEtTemps, total) => (total > 0 ? (completesEtTemps / total) * 100 : 0),
  remplissage: (poids, capacite) => (capacite > 0 ? (poids / capacite) * 100 : 0),

  // ═══════════════════════════════════════════════════
  // MAINTENANCE
  // ═══════════════════════════════════════════════════
  mtbf: (tempsFonctionnement, nbPannes) =>
    nbPannes > 0 ? tempsFonctionnement / nbPannes : 0,
  mttr: (tempsReparation, nbPannes) =>
    nbPannes > 0 ? tempsReparation / nbPannes : 0,
  disponibilite: (mtbf, mttr) =>
    mtbf + mttr > 0 ? (mtbf / (mtbf + mttr)) * 100 : 0,
  tauxPanne: (nbPannes, nbMachines) =>
    nbMachines > 0 ? (nbPannes / nbMachines) * 100 : 0,
  coutMaintenance: (mo, pieces, st) => (mo || 0) + (pieces || 0) + (st || 0),
  failureRate: (failures, equipments) =>
    equipments > 0 ? (failures / equipments) * 100 : 0,
  maintenanceCompletionRate: (completed, planned) =>
    planned > 0 ? (completed / planned) * 100 : 0,
  interventionCost: (labor, parts, external) =>
    (labor || 0) + (parts || 0) + (external || 0),
  costPerMachine: (maintenanceCost, machines) =>
    machines > 0 ? maintenanceCost / machines : 0,
  sparePartsConsumption: (initial, current) => Math.max(0, (initial || 0) - (current || 0)),
  consumedValue: (qty, unitPrice) => (qty || 0) * (unitPrice || 0),

  // ═══════════════════════════════════════════════════
  // FINANCE & COMMERCIAL
  // ═══════════════════════════════════════════════════
  resultatNet: (produits, charges) => produits - charges,
  margeBrute: (ca, coutVentes) => (ca > 0 ? ((ca - coutVentes) / ca) * 100 : 0),
  margeNette: (resultat, ca) => (ca > 0 ? (resultat / ca) * 100 : 0),
  tresorerie: (banque, caisse, dettes) =>
    (banque || 0) + (caisse || 0) - (dettes || 0),
  rentabiliteProduit: (pv, coutRevient) => (pv || 0) - (coutRevient || 0),
  customerBalance: (invoices, payments, creditNotes) =>
    (invoices || 0) - (payments || 0) - (creditNotes || 0),
  dso: (accountsReceivable, dailySales) =>
    dailySales > 0 ? accountsReceivable / dailySales : 0,
  paymentRate: (paidAmount, invoiceAmount) =>
    invoiceAmount > 0 ? (paidAmount / invoiceAmount) * 100 : 0,
  cashBalance: (cashIn, cashOut) => (cashIn || 0) - (cashOut || 0),
  bankBalance: (credits, debits) => (credits || 0) - (debits || 0),
  grossMargin: (revenue, cost) => (revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0),
  netMargin: (netProfit, revenue) => (revenue > 0 ? (netProfit / revenue) * 100 : 0),
  ebitda: (operatingProfit, depreciation, amortization) =>
    (operatingProfit || 0) + (depreciation || 0) + (amortization || 0),
  roi: (gain, investment) =>
    investment > 0 ? ((gain - investment) / investment) * 100 : 0,
  quotationConversionRate: (accepted, total) =>
    total > 0 ? (accepted / total) * 100 : 0,

  // ═══════════════════════════════════════════════════
  // HUMAN RESOURCES
  // ═══════════════════════════════════════════════════
  salaireBrut: (base, prime, hs, indemnites) =>
    (base || 0) + (prime || 0) + (hs || 0) + (indemnites || 0),
  salaireNet: (brut, cotisations) => brut - (cotisations || 0),
  heuresSup: (reelles, normales) => Math.max(0, (reelles || 0) - (normales || 0)),
  tauxAbsenteisme: (absence, theoriques) =>
    theoriques > 0 ? (absence / theoriques) * 100 : 0,
  productivite: (production, nbEmployes) =>
    nbEmployes > 0 ? production / nbEmployes : 0,
  lateHours: (actualArrival, plannedArrival) =>
    Math.max(0, (actualArrival || 0) - (plannedArrival || 0)),
  overtime: (workedHours, standardHours) =>
    Math.max(0, (workedHours || 0) - (standardHours || 0)),
  advanceBalance: (salary, advances) => Math.max(0, (salary || 0) - (advances || 0)),
  grossSalary: (base, bonuses, overtime, allowances) =>
    (base || 0) + (bonuses || 0) + (overtime || 0) + (allowances || 0),
  netSalary: (gross, deductions) => (gross || 0) - (deductions || 0),
  attendanceRate: (presentDays, workingDays) =>
    workingDays > 0 ? (presentDays / workingDays) * 100 : 0,
  employeeSeniority: (hiringDate) =>
    hiringDate ? moment().diff(moment(hiringDate), "years") : 0,

  // ═══════════════════════════════════════════════════
  // CRM
  // ═══════════════════════════════════════════════════
  tauxConversion: (clients, prospects) =>
    prospects > 0 ? (clients / prospects) * 100 : 0,
  valeurPipeline: (opportunites) =>
    opportunites.reduce((s, o) => s + (o.opportunite || 0), 0),

  // ═══════════════════════════════════════════════════
  // SOUS-TRAITANCE
  // ═══════════════════════════════════════════════════
  coutPrestation: (mo, transport, materiel) =>
    (mo || 0) + (transport || 0) + (materiel || 0),
  tauxRespectContrat: (conformes, total) =>
    total > 0 ? (conformes / total) * 100 : 0,

  // ═══════════════════════════════════════════════════
  // SUPPLY CHAIN
  // ═══════════════════════════════════════════════════
  leadTime: (commande, production, transport, reception) =>
    (commande || 0) + (production || 0) + (transport || 0) + (reception || 0),
  fillRate: (servies, total) => (total > 0 ? (servies / total) * 100 : 0),
  perfectOrder: (parfaites, total) => (total > 0 ? (parfaites / total) * 100 : 0),

  // ═══════════════════════════════════════════════════
  // PRODUCTION & QUALITY
  // ═══════════════════════════════════════════════════
  oee: (availability, performance, quality) =>
    ((availability || 0) / 100) * ((performance || 0) / 100) * ((quality || 0) / 100) * 100,
  yield: (goodOutput, totalInput) =>
    totalInput > 0 ? (goodOutput / totalInput) * 100 : 0,
  qualityRate: (goodUnits, totalUnits) =>
    totalUnits > 0 ? (goodUnits / totalUnits) * 100 : 0,
  rejectionRate: (rejected, total) =>
    total > 0 ? (rejected / total) * 100 : 0,

  // ═══════════════════════════════════════════════════
  // FORMATTING
  // ═══════════════════════════════════════════════════
  formatCurrency: (val) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "MAD",
      maximumFractionDigits: 0,
    }).format(val || 0),
  formatNumber: (val) => new Intl.NumberFormat("fr-FR").format(val || 0),
  formatPercent: (val) => `${(val || 0).toFixed(1)}%`,
  formatDate: (date) => (date ? moment(date).format("DD/MM/YYYY") : "—"),
  formatDateTime: (date) => (date ? moment(date).format("DD/MM/YYYY HH:mm") : "—"),
};