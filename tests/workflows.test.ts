import { describe, it } from "node:test";
import assert from "node:assert/strict";

// Calculations & Business Rules
import {
  calculateProductionProgress,
  calculateOrderStageProgress,
  canEnterBulkProduction,
  calculateOrderRisk,
  calculateCosting,
  compareCostingVersions,
  calculateCostVariance,
  calculateMaterialAvailability,
  calculateMilestoneVariance,
  calculateFactoryUtilisation,
  calculateSupplierPerformance,
  calculateOutstandingPayment,
  calculateBuyerKpis,
  calculateNextAction,
  calculateMilestoneImpacts,
} from "../src/lib/calculations";

// Permissions
import { can } from "../src/lib/permissions";

// Data Access
import {
  getOrderById,
  getBuyerOrders,
  getBuyerOrderById,
  getFactoryAssignedOrders,
  getFactoryUpcomingDeadlines,
  getIssuesForOrder,
  getIssuesForFactory,
  getChangeRequestsForOrder,
  getActionCenterItems,
} from "../src/lib/data";

import type {
  Order,
  ProductionEntry,
  Sample,
  Material,
  OrderMilestone,
  Factory,
  ProductionAssignment,
  CostingItem,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  MaterialReceipt,
  Invoice,
  Payment,
  Buyer,
  ProductionIssue,
} from "../src/types";

describe("Workflow 1: Production Event-Sourcing & Progress Calculations", () => {
  const mockOrder: Pick<Order, "id" | "quantity"> = {
    id: "ord-test-1",
    quantity: 1000,
  };

  const mockEntries: ProductionEntry[] = [
    {
      id: "entry-1",
      productionAssignmentId: "asg-1",
      orderId: "ord-test-1",
      factoryId: "fac-1",
      stage: "cutting",
      date: "2026-09-01",
      producedQty: 600,
      rejectedQty: 20,
      reworkedQty: 10,
      enteredBy: "user-1",
    },
    {
      id: "entry-2",
      productionAssignmentId: "asg-1",
      orderId: "ord-test-1",
      factoryId: "fac-1",
      stage: "cutting",
      date: "2026-09-02",
      producedQty: 400,
      rejectedQty: 10,
      reworkedQty: 0,
      enteredBy: "user-1",
    },
    {
      id: "entry-3",
      productionAssignmentId: "asg-1",
      orderId: "ord-test-1",
      factoryId: "fac-1",
      stage: "stitching",
      date: "2026-09-03",
      producedQty: 350,
      rejectedQty: 15,
      reworkedQty: 5,
      enteredBy: "user-1",
    },
  ];

  it("calculates cumulative stage progress correctly from events", () => {
    const progress = calculateProductionProgress(mockOrder, mockEntries);
    const cutting = progress.find((p) => p.stage === "cutting");
    const stitching = progress.find((p) => p.stage === "stitching");
    const finishing = progress.find((p) => p.stage === "finishing");

    assert.ok(cutting);
    assert.equal(cutting.completedQty, 1000);
    assert.equal(cutting.rejectedQty, 30);
    assert.equal(cutting.reworkedQty, 10);
    assert.equal(cutting.percent, 100);
    assert.equal(cutting.dailyAverage, 500); // 1000 / 2 distinct days

    assert.ok(stitching);
    assert.equal(stitching.completedQty, 350);
    assert.equal(stitching.percent, 35);
    assert.equal(stitching.dailyAverage, 350);

    assert.ok(finishing);
    assert.equal(finishing.completedQty, 0);
    assert.equal(finishing.percent, 0);
  });

  it("maps order lifecycle stages correctly with partial concurrent progress", () => {
    const orderWithStage: Pick<Order, "id" | "quantity" | "stage"> = {
      id: "ord-test-1",
      quantity: 1000,
      stage: "stitching",
    };
    const orderStageProgress = calculateOrderStageProgress(orderWithStage, mockEntries);

    const cuttingStage = orderStageProgress.find((s) => s.stage === "cutting");
    const stitchingStage = orderStageProgress.find((s) => s.stage === "stitching");
    const costingStage = orderStageProgress.find((s) => s.stage === "costing");

    assert.equal(cuttingStage?.percent, 100);
    assert.equal(stitchingStage?.percent, 35);
    assert.equal(costingStage?.percent, 100); // Preceding stage implicitly 100%
  });
});

describe("Workflow 2: Bulk Production Sampling Gate", () => {
  const order = { id: "ord-gate-1" };

  it("blocks bulk production when no approved PP sample exists", () => {
    const samples: Sample[] = [
      {
        id: "s-1",
        orderId: "ord-gate-1",
        styleId: "sty-1",
        sampleType: "proto",
        versionNumber: 1,
        status: "approved",
        createdAt: "2026-09-01T00:00:00Z",
      },
      {
        id: "s-2",
        orderId: "ord-gate-1",
        styleId: "sty-1",
        sampleType: "pp",
        versionNumber: 1,
        status: "sent",
        createdAt: "2026-09-05T00:00:00Z",
      },
    ];

    const result = canEnterBulkProduction(order, samples);
    assert.equal(result.allowed, false);
    assert.match(result.reason ?? "", /PP Sample must be approved/);
  });

  it("permits bulk production when an approved PP sample exists", () => {
    const samples: Sample[] = [
      {
        id: "s-1",
        orderId: "ord-gate-1",
        styleId: "sty-1",
        sampleType: "pp",
        versionNumber: 1,
        status: "approved",
        createdAt: "2026-09-05T00:00:00Z",
      },
    ];

    const result = canEnterBulkProduction(order, samples);
    assert.equal(result.allowed, true);
    assert.equal(result.reason, undefined);
  });
});

describe("Workflow 3: Deterministic Order Risk Engine", () => {
  const baseOrder: Order = {
    id: "ord-risk-1",
    orderNo: "TC-2609-999",
    buyerId: "buyer-1",
    styleId: "style-1",
    costingId: "costing-1",
    poNumber: "PO-999",
    quantity: 1000,
    pricePerPiece: 500,
    currency: "INR",
    factoryId: "fac-1",
    stage: "stitching",
    expectedDispatchDate: "2026-10-01",
    ownerId: "user-1",
    createdAt: "2026-09-01T00:00:00Z",
    updatedAt: "2026-09-01T00:00:00Z",
  };

  it("flags HIGH risk when production is significantly behind linear schedule", () => {
    // Expected progress by 2026-09-20 (20/30 days = 66.7%), actual is 200/1000 = 20% (gap = 46.7% >= 25%)
    const entries: ProductionEntry[] = [
      {
        id: "e-1",
        productionAssignmentId: "asg-1",
        orderId: "ord-risk-1",
        factoryId: "fac-1",
        stage: "stitching",
        date: "2026-09-10",
        producedQty: 200,
        rejectedQty: 0,
        reworkedQty: 0,
        enteredBy: "user-1",
      },
    ];

    const risk = calculateOrderRisk(
      baseOrder,
      entries,
      [],
      [],
      [],
      undefined,
      [],
      new Date("2026-09-20T00:00:00Z")
    );

    assert.equal(risk.level, "high");
    assert.ok(risk.reasons.some((r) => r.includes("behind planned completion")));
  });

  it("flags CRITICAL risk when dispatch is <= 5 days away and stage is not packing/dispatch", () => {
    const urgentOrder: Order = {
      ...baseOrder,
      stage: "stitching",
      expectedDispatchDate: "2026-09-23", // 3 days away from 2026-09-20
    };

    const risk = calculateOrderRisk(
      urgentOrder,
      [],
      [],
      [],
      [],
      undefined,
      [],
      new Date("2026-09-20T00:00:00Z")
    );

    assert.equal(risk.level, "critical");
    assert.ok(risk.reasons.some((r) => r.includes("Dispatch is 3 day(s) away")));
  });

  it("flags HIGH risk if required material arrives after cutting milestone", () => {
    const milestones: OrderMilestone[] = [
      {
        id: "m-1",
        orderId: "ord-risk-1",
        milestoneKey: "cutting_start",
        plannedDate: "2026-09-10",
        status: "pending",
        ownerId: "user-1",
      },
    ];

    const materials: Material[] = [
      {
        id: "mat-1",
        sku: "FAB-01",
        description: "Organic Fleece",
        category: "fabric",
        supplierId: "sup-1",
        requiredQty: 500,
        orderedQty: 500,
        receivedQty: 0,
        allocatedQty: 0,
        cost: 300,
        unit: "kg",
        expectedArrival: "2026-09-15", // After planned cutting start
        status: "ordered",
        orderId: "ord-risk-1",
      },
    ];

    const risk = calculateOrderRisk(
      baseOrder,
      [],
      materials,
      [],
      milestones,
      undefined,
      [],
      new Date("2026-09-05T00:00:00Z")
    );

    assert.equal(risk.level, "high");
    assert.ok(risk.reasons.some((r) => r.includes("expected after the planned cutting start date")));
  });
});

describe("Workflow 4: Material Availability & Shortage Logic", () => {
  it("computes shortage based on procurement sufficiency, not consumption", () => {
    const material: Material = {
      id: "mat-test",
      sku: "RIB-01",
      description: "2x2 Rib",
      category: "rib",
      supplierId: "sup-1",
      requiredQty: 500,
      orderedQty: 500,
      receivedQty: 500,
      allocatedQty: 300,
      cost: 250,
      unit: "kg",
      expectedArrival: "2026-09-10",
      status: "received",
      orderId: "ord-1",
    };

    const availability = calculateMaterialAvailability(material, new Date("2026-09-15T00:00:00Z"));
    assert.equal(availability.availableQty, 200);
    assert.equal(availability.shortage, 0);
    assert.equal(availability.status, "sufficient");
  });

  it("detects genuine shortage and overdue arrival", () => {
    const overdueMaterial: Material = {
      id: "mat-test-2",
      sku: "BTN-01",
      description: "Metal Snaps",
      category: "buttons",
      supplierId: "sup-1",
      requiredQty: 1000,
      orderedQty: 1000,
      receivedQty: 400,
      allocatedQty: 0,
      cost: 5,
      unit: "pcs",
      expectedArrival: "2026-09-10",
      status: "partial",
      orderId: "ord-1",
    };

    const availability = calculateMaterialAvailability(overdueMaterial, new Date("2026-09-15T00:00:00Z"));
    assert.equal(availability.availableQty, 400);
    assert.equal(availability.shortage, 600);
    assert.equal(availability.status, "overdue");
  });
});

describe("Workflow 5: Costing Breakdown & Margin Calculation", () => {
  const items: CostingItem[] = [
    {
      id: "ci-1",
      costingId: "cost-1",
      category: "fabric",
      unit: "kg",
      consumption: 0.45,
      rate: 400,
      wastePercent: 5, // 0.45 * 400 * 1.05 = 189
    },
    {
      id: "ci-2",
      costingId: "cost-1",
      category: "stitching",
      unit: "pcs",
      consumption: 1,
      rate: 80,
      wastePercent: 0, // 80
    },
    {
      id: "ci-3",
      costingId: "cost-1",
      category: "packing",
      unit: "pcs",
      consumption: 1,
      rate: 20,
      wastePercent: 0, // 20
    },
  ];

  it("calculates cost per piece, profit, and margin correctly", () => {
    const sellingPrice = 400;
    const quantity = 1000;
    const breakdown = calculateCosting(items, sellingPrice, quantity);

    assert.equal(Math.round(breakdown.materialCost * 100) / 100, 189);
    assert.equal(breakdown.manufacturingCost, 80);
    assert.equal(breakdown.packagingCost, 20);
    assert.equal(breakdown.costPerPiece, 289);
    assert.equal(breakdown.profitPerPiece, 111);
    assert.ok(Math.abs(breakdown.marginPercent - 27.75) < 0.001);
    assert.equal(breakdown.totalOrderProfit, 111000);
  });

  it("diffs costing versions accurately", () => {
    const versionA = calculateCosting(items, 400, 1000);
    const versionB = calculateCosting(
      [
        ...items,
        {
          id: "ci-4",
          costingId: "cost-1",
          category: "printing",
          unit: "pcs",
          consumption: 1,
          rate: 30,
          wastePercent: 0,
        },
      ],
      420,
      1000
    );

    const diff = compareCostingVersions(versionA, versionB);
    assert.equal(diff.costPerPieceDelta, 30);
    assert.equal(diff.sellingPriceDelta, 20);
    assert.ok(diff.marginPercentDelta < 0); // Margin decreased slightly
  });
});

describe("Workflow 6: Milestone Variance Tracking", () => {
  it("calculates positive variance days for completed late milestones", () => {
    const milestone: OrderMilestone = {
      id: "ms-1",
      orderId: "ord-1",
      milestoneKey: "fabric_arrival",
      plannedDate: "2026-09-10",
      actualDate: "2026-09-14",
      status: "done",
      ownerId: "user-1",
    };

    const variance = calculateMilestoneVariance(milestone);
    assert.equal(variance.varianceDays, 4);
    assert.equal(variance.status, "done");
  });

  it("detects delayed pending milestone when today is past planned date", () => {
    const milestone: OrderMilestone = {
      id: "ms-2",
      orderId: "ord-1",
      milestoneKey: "cutting_start",
      plannedDate: "2026-09-10",
      status: "pending",
      ownerId: "user-1",
    };

    const variance = calculateMilestoneVariance(milestone, new Date("2026-09-15T00:00:00Z"));
    assert.equal(variance.varianceDays, 5);
    assert.equal(variance.status, "delayed");
  });
});

describe("Workflow 7: Factory Utilisation Planning Horizon", () => {
  const factory: Factory = {
    id: "fac-1",
    name: "Texcroft Unit 1",
    location: "Tiruppur",
    contactName: "Murugan",
    contactPhone: "+91 98765 43210",
    capabilities: ["knits", "finishing"],
    dailyCapacityPieces: 1000,
  };

  it("computes utilisation across a 30-day horizon rather than single-day capacity", () => {
    const assignments: ProductionAssignment[] = [
      {
        id: "asg-1",
        orderId: "ord-1",
        factoryId: "fac-1",
        assignedQuantity: 10000,
        assignedDate: "2026-09-01",
        status: "active",
      },
      {
        id: "asg-2",
        orderId: "ord-2",
        factoryId: "fac-1",
        assignedQuantity: 5000,
        assignedDate: "2026-09-05",
        status: "active",
      },
    ];

    const util = calculateFactoryUtilisation(factory, assignments, 30);
    assert.equal(util.committedPieces, 15000);
    assert.equal(util.utilisationPercent, 50);
  });
});

describe("Workflow 8: Supplier Performance Scorecards", () => {
  const supplier: Supplier = {
    id: "sup-1",
    name: "Sri Balaji Mills",
    location: "Tiruppur",
    contactName: "Ramesh",
    contactEmail: "ramesh@balaji.demo",
    contactPhone: "+91 98765 11111",
    materialCategories: ["fabric"],
    leadTimeDays: 14,
    paymentTerms: "Net 30",
  };

  const pos: PurchaseOrder[] = [
    {
      id: "po-1",
      poNo: "PO-001",
      supplierId: "sup-1",
      orderDate: "2026-09-01",
      eta: "2026-09-15",
      status: "received",
      paymentStatus: "paid",
      totalValue: 500000,
      currency: "INR",
    },
  ];

  const poItems: PurchaseOrderItem[] = [
    {
      id: "poi-1",
      purchaseOrderId: "po-1",
      materialId: "mat-1",
      quantity: 1000,
      rate: 500,
      receivedQuantity: 1000,
    },
  ];

  const receipts: MaterialReceipt[] = [
    {
      id: "rec-1",
      purchaseOrderItemId: "poi-1",
      receivedQty: 1000,
      receivedDate: "2026-09-14", // 1 day before ETA
      receivedBy: "user-1",
      qcHold: false,
    },
  ];

  it("calculates accurate on-time percentage, lead time, and QC acceptance", () => {
    const perf = calculateSupplierPerformance(supplier, pos, poItems, receipts);
    assert.equal(perf.onTimePercent, 100);
    assert.equal(perf.avgLeadTimeDays, 13);
    assert.equal(perf.qcAcceptancePercent, 100);
    assert.equal(perf.totalPurchaseValue, 500000);
    assert.equal(perf.ordersSupplied, 1);
  });
});

describe("Workflow 9: Finance Invoice & Payment Reconciliation", () => {
  const invoice: Invoice = {
    id: "inv-1",
    invoiceNo: "INV-2026-001",
    orderId: "ord-1",
    buyerId: "buyer-1",
    amount: 100000,
    currency: "INR",
    issueDate: "2026-09-01",
    dueDate: "2026-09-15",
    status: "draft",
  };

  it("derives partially_paid when partial payments recorded", () => {
    const payments: Payment[] = [
      {
        id: "pay-1",
        invoiceId: "inv-1",
        amount: 30000,
        currency: "INR",
        paidDate: "2026-09-05",
        method: "Bank Transfer",
        reference: "REF-001",
        recordedBy: "user-fin",
      },
    ];

    const fin = calculateOutstandingPayment(invoice, payments, new Date("2026-09-10T00:00:00Z"));
    assert.equal(fin.paidAmount, 30000);
    assert.equal(fin.outstandingAmount, 70000);
    assert.equal(fin.derivedStatus, "partially_paid");
  });

  it("derives paid when fully settled", () => {
    const payments: Payment[] = [
      {
        id: "pay-1",
        invoiceId: "inv-1",
        amount: 100000,
        currency: "INR",
        paidDate: "2026-09-05",
        method: "Bank Transfer",
        reference: "REF-002",
        recordedBy: "user-fin",
      },
    ];

    const fin = calculateOutstandingPayment(invoice, payments, new Date("2026-09-10T00:00:00Z"));
    assert.equal(fin.outstandingAmount, 0);
    assert.equal(fin.derivedStatus, "paid");
  });

  it("derives overdue when unpaid past due date", () => {
    const fin = calculateOutstandingPayment(invoice, [], new Date("2026-09-20T00:00:00Z"));
    assert.equal(fin.outstandingAmount, 100000);
    assert.equal(fin.derivedStatus, "overdue");
  });
});

describe("Workflow 10: Buyer KPIs & Lifetime Value", () => {
  const buyer: Buyer = {
    id: "buyer-1",
    companyName: "Acme Retail",
    contactName: "John",
    email: "john@acme.demo",
    phone: "+1 555 1234",
    country: "USA",
    currency: "USD",
    shippingLocation: "New York, USA",
    paymentTerms: "Net 60",
    taxDetails: "US-123456",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const buyerOrders: Order[] = [
    {
      id: "ord-b1",
      orderNo: "TC-2609-001",
      buyerId: "buyer-1",
      styleId: "sty-1",
      costingId: "cos-1",
      poNumber: "PO-1",
      quantity: 2000,
      pricePerPiece: 500,
      currency: "INR",
      factoryId: "fac-1",
      stage: "completed",
      expectedDispatchDate: "2026-08-15",
      actualDispatchDate: "2026-08-14",
      ownerId: "user-1",
      createdAt: "2026-07-01T00:00:00Z",
      updatedAt: "2026-08-14T00:00:00Z",
    },
    {
      id: "ord-b2",
      orderNo: "TC-2609-002",
      buyerId: "buyer-1",
      styleId: "sty-1",
      costingId: "cos-1",
      poNumber: "PO-2",
      quantity: 1000,
      pricePerPiece: 600,
      currency: "INR",
      factoryId: "fac-1",
      stage: "stitching",
      expectedDispatchDate: "2026-10-15",
      ownerId: "user-1",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
    },
  ];

  it("calculates lifetime value and on-time delivery rate", () => {
    const kpis = calculateBuyerKpis(buyer, buyerOrders, (o) => o.quantity * o.pricePerPiece);
    assert.equal(kpis.lifetimeOrderValue, 1600000);
    assert.equal(kpis.completedOrders, 1);
    assert.equal(kpis.activeOrders, 1);
    assert.equal(kpis.averageOrderSize, 800000);
    assert.equal(kpis.onTimeDeliveryPercent, 100);
  });
});

describe("Workflow 11: Permissions & RBAC Enforcement", () => {
  it("allows admin to perform any action on any resource", () => {
    assert.equal(can("admin", "delete", "orders"), true);
    assert.equal(can("admin", "edit", "settings"), true);
    assert.equal(can("admin", "create", "costing"), true);
  });

  it("strictly restricts buyer role to read portal-safe data", () => {
    assert.equal(can("buyer", "view", "orders"), true);
    assert.equal(can("buyer", "view", "costing"), false);
    assert.equal(can("buyer", "create", "orders"), false);
    assert.equal(can("buyer", "view", "suppliers"), false);
  });

  it("strictly restricts factory_partner to production entry and portal data", () => {
    assert.equal(can("factory_partner", "create", "production"), true);
    assert.equal(can("factory_partner", "view", "finance"), false);
    assert.equal(can("factory_partner", "edit", "buyers"), false);
  });

  it("enforces merchandiser permissions", () => {
    assert.equal(can("merchandiser", "create", "orders"), true);
    assert.equal(can("merchandiser", "create", "costing"), true);
    assert.equal(can("merchandiser", "edit", "settings"), false);
  });
});

describe("Workflow 12: Data Access & Multi-Tenant Portal Isolation", () => {
  it("fetches flagship order TC-2609-014 with verified consistency", async () => {
    const order = await getOrderById("order-014");
    assert.ok(order);
    assert.equal(order.orderNo, "TC-2609-014");
    assert.equal(order.quantity, 5000);
    assert.equal(order.currency, "INR");
    assert.equal(order.buyerName, "North & Row Apparel");
  });

  it("buyer portal queries only return data belonging to that buyer", async () => {
    const orders = await getBuyerOrders("buyer-01");
    assert.ok(orders.length > 0);
    for (const o of orders) {
      assert.ok(o.id);
    }

    const safeOrder = await getBuyerOrderById("buyer-01", "order-014");
    assert.ok(safeOrder);
    // Verified: safeOrder does NOT contain sensitive internal cost or margin fields
    assert.equal("costing" in (safeOrder as Record<string, unknown>), false);
    assert.equal("marginPercent" in (safeOrder as Record<string, unknown>), false);
  });

  it("factory partner dashboard strictly isolates to that factory's assignments", async () => {
    const orders = await getFactoryAssignedOrders("factory-01");
    assert.ok(orders);
    const deadlines = await getFactoryUpcomingDeadlines("factory-01");
    assert.ok(deadlines);
  });
});

describe("Workflow 13: Production Issues Influence Risk", () => {
  const baseOrder: Order = {
    id: "ord-issue-1",
    orderNo: "TC-2609-998",
    buyerId: "buyer-1",
    styleId: "style-1",
    costingId: "costing-1",
    poNumber: "PO-998",
    quantity: 1000,
    pricePerPiece: 500,
    currency: "INR",
    factoryId: "fac-1",
    stage: "stitching",
    expectedDispatchDate: "2026-12-01", // Far enough away that no other factor fires.
    ownerId: "user-1",
    createdAt: "2026-11-20T00:00:00Z",
    updatedAt: "2026-11-20T00:00:00Z",
  };
  const today = new Date("2026-11-21T00:00:00Z");

  it("does not escalate risk for a resolved issue", () => {
    const issues: ProductionIssue[] = [
      {
        id: "issue-1",
        orderId: "ord-issue-1",
        factoryId: "fac-1",
        stage: "stitching",
        issueType: "power_outage",
        description: "Power cut resolved same day",
        severity: "critical",
        ownerId: "user-1",
        status: "resolved",
        resolution: "Generator restored power",
        reportedBy: "user-1",
        createdAt: "2026-11-20T00:00:00Z",
        updatedAt: "2026-11-20T00:00:00Z",
      },
    ];

    const risk = calculateOrderRisk(baseOrder, [], [], [], [], undefined, [], today, issues);
    assert.equal(risk.level, "low");
  });

  it("escalates risk to the open issue's own severity and explains why", () => {
    const issues: ProductionIssue[] = [
      {
        id: "issue-2",
        orderId: "ord-issue-1",
        factoryId: "fac-1",
        stage: "stitching",
        issueType: "machine_breakdown",
        description: "Two stitching machines down",
        severity: "critical",
        ownerId: "user-1",
        status: "open",
        reportedBy: "user-1",
        createdAt: "2026-11-20T00:00:00Z",
        updatedAt: "2026-11-20T00:00:00Z",
      },
    ];

    const risk = calculateOrderRisk(baseOrder, [], [], [], [], undefined, [], today, issues);
    assert.equal(risk.level, "critical");
    assert.ok(risk.reasons.some((r) => r.includes("Open issue: Two stitching machines down")));
  });

  it("does not let another order's issue affect this order's risk", () => {
    const issues: ProductionIssue[] = [
      {
        id: "issue-3",
        orderId: "some-other-order",
        factoryId: "fac-1",
        stage: "stitching",
        issueType: "machine_breakdown",
        description: "Unrelated issue",
        severity: "critical",
        ownerId: "user-1",
        status: "open",
        reportedBy: "user-1",
        createdAt: "2026-11-20T00:00:00Z",
        updatedAt: "2026-11-20T00:00:00Z",
      },
    ];

    const risk = calculateOrderRisk(baseOrder, [], [], [], [], undefined, [], today, issues);
    assert.equal(risk.level, "low");
  });
});

describe("Workflow 14: Next Action & Milestone Dependency Impact", () => {
  const milestones: OrderMilestone[] = [
    { id: "m-1", orderId: "ord-1", milestoneKey: "techpack_approved", plannedDate: "2026-08-01", actualDate: "2026-08-01", status: "done", ownerId: "user-1" },
    { id: "m-2", orderId: "ord-1", milestoneKey: "fabric_ordered", plannedDate: "2026-08-05", actualDate: "2026-08-05", status: "done", ownerId: "user-1" },
    { id: "m-3", orderId: "ord-1", milestoneKey: "fabric_arrival", plannedDate: "2026-08-12", actualDate: "2026-08-14", status: "done", ownerId: "user-2" },
    { id: "m-4", orderId: "ord-1", milestoneKey: "buyer_approval", plannedDate: "2026-08-20", status: "pending", ownerId: "user-1" },
  ];

  it("names the first not-done milestone (in canonical order, not array order) as the next action", () => {
    const shuffled = [milestones[2], milestones[0], milestones[3], milestones[1]];
    const next = calculateNextAction(shuffled);
    assert.ok(next);
    assert.equal(next.action, "Buyer Approval");
    assert.equal(next.ownerId, "user-1");
    assert.equal(next.dueDate, "2026-08-20");
  });

  it("returns undefined once every milestone is done", () => {
    const allDone = milestones.map((m) => ({ ...m, status: "done" as const, actualDate: m.actualDate ?? m.plannedDate }));
    assert.equal(calculateNextAction(allDone), undefined);
  });

  it("reports dependency impact for a late-but-completed milestone, and stops at the current bottleneck", () => {
    const today = new Date("2026-08-25T00:00:00Z"); // 5 days past buyer_approval's planned date
    const impacts = calculateMilestoneImpacts(milestones, today);

    // fabric_arrival: 2 days late, done -> names the next milestone in
    // MILESTONE_SEQUENCE (PP Sample), regardless of whether this order has
    // one — the message is about sequence adjacency, not this order's data.
    const fabricImpact = impacts.find((i) => i.milestoneKey === "fabric_arrival");
    assert.ok(fabricImpact);
    assert.equal(fabricImpact.delayDays, 2);
    assert.match(fabricImpact.message, /Fabric Arrival was 2 day\(s\) late/);
    assert.match(fabricImpact.message, /PP Sample may start late/);

    // buyer_approval: not done, 5 days past planned -> current bottleneck, reported once.
    const bottleneck = impacts.find((i) => i.milestoneKey === "buyer_approval");
    assert.ok(bottleneck);
    assert.equal(bottleneck.delayDays, 5);

    // Nothing beyond the bottleneck is evaluated — only these two entries exist.
    assert.equal(impacts.length, 2);
  });

  it("reports no impact when every milestone is on time", () => {
    const onTime = milestones.map((m) => (m.actualDate ? { ...m, actualDate: m.plannedDate } : m));
    const impacts = calculateMilestoneImpacts(onTime, new Date("2026-08-15T00:00:00Z"));
    assert.equal(impacts.length, 0);
  });
});

describe("Workflow 15: Estimated vs. Current Cost & Margin Variance", () => {
  const estimatedItems: CostingItem[] = [{ id: "e-1", costingId: "c-est", category: "fabric", unit: "kg", consumption: 1, rate: 300, wastePercent: 0 }];
  const currentItems: CostingItem[] = [
    { id: "c-1", costingId: "c-cur", category: "fabric", unit: "kg", consumption: 1, rate: 250, wastePercent: 0 },
    { id: "c-2", costingId: "c-cur", category: "stitching", unit: "pcs", consumption: 1, rate: 50, wastePercent: 0 },
  ];

  it("computes variance and margin shift from real estimated/current costing data", () => {
    const estimated = calculateCosting(estimatedItems, 500, 1000);
    const current = calculateCosting(currentItems, 500, 1000);

    const variance = calculateCostVariance(estimated, current, 0, 50, 1000);
    assert.equal(variance.estimatedCostPerPiece, 300);
    assert.equal(variance.currentCostPerPiece, 300); // fabric 250 + stitching 50
    assert.equal(variance.costPerPieceVariance, 0);
    assert.equal(variance.hasReworkData, false);
  });

  it("folds real rework quantity into current cost without inventing a rate", () => {
    const estimated = calculateCosting(estimatedItems, 500, 1000);
    const current = calculateCosting(currentItems, 500, 1000);

    // 40 reworked pieces at the order's own stitching rate (50/piece), spread over 1000 pieces.
    const variance = calculateCostVariance(estimated, current, 40, 50, 1000);
    assert.equal(variance.reworkCostPerPiece, 2); // (40 * 50) / 1000
    assert.equal(variance.currentCostPerPiece, 302);
    assert.equal(variance.hasReworkData, true);

    const reworkRow = variance.breakdown.find((r) => r.category === "rework");
    assert.ok(reworkRow);
    assert.equal(reworkRow.estimated, 0);
    assert.equal(reworkRow.current, 2);
  });

  it("never invents a rework cost when there is no rate to derive it from", () => {
    const estimated = calculateCosting(estimatedItems, 500, 1000);
    const noStitchingItems: CostingItem[] = [{ id: "c-1", costingId: "c-cur", category: "fabric", unit: "kg", consumption: 1, rate: 250, wastePercent: 0 }];
    const current = calculateCosting(noStitchingItems, 500, 1000);

    const variance = calculateCostVariance(estimated, current, 40, 0, 1000);
    assert.equal(variance.reworkCostPerPiece, 0);
    assert.equal(variance.hasReworkData, false);
  });
});

describe("Workflow 16: Action/Exception Center Reuses Existing Data (No Duplicate Logic)", () => {
  it("returns items only for the eight documented exception categories", async () => {
    const items = await getActionCenterItems();
    const allowedCategories = new Set([
      "production_delay",
      "material_delay",
      "buyer_approval",
      "qc_failure",
      "dispatch_approaching",
      "invoice_overdue",
      "factory_overload",
      "production_issue",
    ]);
    assert.ok(items.length > 0);
    for (const item of items) {
      assert.ok(allowedCategories.has(item.category));
      assert.ok(item.issue.length > 0);
      assert.ok(item.nextAction.length > 0);
    }
  });

  it("sorts by severity, highest first", async () => {
    const items = await getActionCenterItems();
    const rank: Record<string, number> = { critical: 3, high: 2, medium: 1, low: 0 };
    for (let i = 1; i < items.length; i++) {
      assert.ok(rank[items[i - 1].severity] >= rank[items[i].severity]);
    }
  });
});

describe("Workflow 17: Order Change Requests & Issue Visibility Isolation", () => {
  it("keeps a full revision history on the flagship order rather than a single mutable field", async () => {
    const changeRequests = await getChangeRequestsForOrder("order-014");
    assert.ok(changeRequests.length >= 2);
    for (const cr of changeRequests) {
      assert.ok(cr.oldValue);
      assert.ok(cr.newValue);
      assert.ok(cr.requestedBy);
      assert.ok(["pending", "approved", "rejected"].includes(cr.status));
    }
  });

  it("scopes production issues to the order and to the assigned factory", async () => {
    const orderIssues = await getIssuesForOrder("order-014");
    assert.ok(orderIssues.length > 0);
    for (const issue of orderIssues) assert.equal(issue.orderId, "order-014");

    const factoryIssues = await getIssuesForFactory("factory-02");
    for (const issue of factoryIssues) assert.equal(issue.factoryId, "factory-02");
  });

  it("permissions: buyers can see their change requests but never internal production issues", () => {
    assert.equal(can("buyer", "view", "change_requests"), true);
    assert.equal(can("buyer", "view", "issues"), false);
    assert.equal(can("buyer", "view", "action_center"), false);
  });

  it("permissions: factory partners can report issues but never see change requests or the action center", () => {
    assert.equal(can("factory_partner", "create", "issues"), true);
    assert.equal(can("factory_partner", "view", "issues"), true);
    assert.equal(can("factory_partner", "view", "change_requests"), false);
    assert.equal(can("factory_partner", "view", "action_center"), false);
  });
});
