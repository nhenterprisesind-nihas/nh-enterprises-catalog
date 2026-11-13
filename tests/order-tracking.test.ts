import assert from "node:assert/strict";
import test from "node:test";
import {
  areMobileNumbersEqual,
  buildTrackingSupportMessage,
  getTrackingStatus,
  isOrderLookupRateLimited,
  normalizeIndianMobileNumber,
  normalizeOrderNumber,
  normalizeTrackingOrderItems,
  formatTrackingPrice,
  ORDER_LOOKUP_MAX_ATTEMPTS,
  ORDER_TRACKING_STEPS,
  verifyTrackingRequest,
  type TrackingOrderRecord,
} from "../lib/order-tracking";

const ORDER_ONE: TrackingOrderRecord = {
  order_no: "NH202611131234560001",
  phone: "+91 98765 43210",
  status: "Dispatched",
  created_at: "2026-11-13T10:00:00.000Z",
  subtotal: 1200,
  shipping: 50,
  grand_total: 1250,
};

const ORDER_TWO: TrackingOrderRecord = {
  order_no: "NH202611131234560002",
  phone: "9876543210",
  status: "Complete",
  created_at: "2026-11-13T11:00:00.000Z",
  subtotal: "800",
  shipping: "40",
  grand_total: "840",
};

test("accepts the shown and stored order-number formats", () => {
  assert.equal(normalizeOrderNumber("nh20261113123456"), "NH20261113123456");
  assert.equal(
    normalizeOrderNumber(ORDER_ONE.order_no),
    ORDER_ONE.order_no
  );
  assert.equal(normalizeOrderNumber("not-an-order"), null);
});

test("normalizes Indian mobile formats and rejects invalid values", () => {
  assert.equal(normalizeIndianMobileNumber("+91 98765-43210"), "9876543210");
  assert.equal(normalizeIndianMobileNumber("0091 (98765) 43210"), "9876543210");
  assert.equal(normalizeIndianMobileNumber("09876543210"), "9876543210");
  assert.equal(normalizeIndianMobileNumber("12345"), null);
  assert.equal(areMobileNumbersEqual("9876543210", "+91 98765 43210"), true);
});

test("requires both details and hides order existence on mismatches", async () => {
  const findOrder = async (orderNumber: string) => ({
    order:
      orderNumber === ORDER_ONE.order_no
        ? ORDER_ONE
        : null,
  });

  assert.deepEqual(
    await verifyTrackingRequest("", "9876543210", findOrder),
    { kind: "invalid", field: "orderNumber" }
  );
  assert.deepEqual(
    await verifyTrackingRequest(ORDER_ONE.order_no, "", findOrder),
    { kind: "invalid", field: "mobileNumber" }
  );
  assert.deepEqual(
    await verifyTrackingRequest(
      ORDER_ONE.order_no,
      "9999999999",
      findOrder
    ),
    { kind: "not-found" }
  );
  assert.deepEqual(
    await verifyTrackingRequest(
      "NH202611131234560099",
      "9876543210",
      findOrder
    ),
    { kind: "not-found" }
  );
});

test("looks up separate orders belonging to the same mobile independently", async () => {
  const orders = new Map([
    [ORDER_ONE.order_no, ORDER_ONE],
    [ORDER_TWO.order_no, ORDER_TWO],
  ]);
  const findOrder = async (orderNumber: string) => ({
    order: orders.get(orderNumber) ?? null,
  });

  const first = await verifyTrackingRequest(
    ORDER_ONE.order_no,
    "9876543210",
    findOrder
  );
  const second = await verifyTrackingRequest(
    ORDER_TWO.order_no,
    "+91 98765 43210",
    findOrder
  );

  assert.equal(first.kind, "found");
  assert.equal(second.kind, "found");
  if (first.kind === "found" && second.kind === "found") {
    assert.equal(first.order.orderNumber, ORDER_ONE.order_no);
    assert.equal(second.order.orderNumber, ORDER_TWO.order_no);
  }
});

test("maps the four progress values and leaves unexpected statuses pending", () => {
  const storedStatuses = ["Placed", "Accepted", "Dispatched", "Complete"];
  storedStatuses.forEach((status, index) => {
    const result = getTrackingStatus(status);
    assert.equal(result.label, ORDER_TRACKING_STEPS[index]);
    assert.equal(result.progressIndex, index);
  });
  assert.equal(getTrackingStatus("Completed").progressIndex, 3);

  const unexpected = getTrackingStatus("Review Needed");
  assert.equal(unexpected.progressIndex, -1);
  assert.notEqual(unexpected.label, "Completed");
});

test("builds a WhatsApp support message with the displayed order snapshot", () => {
  const message = buildTrackingSupportMessage({
    orderNumber: ORDER_ONE.order_no,
    orderDate: ORDER_ONE.created_at,
    status: "Order Shipped",
    items: [
      {
        productName: "Temple Necklace",
        quantity: 2,
        unitPrice: 600,
        amount: 1200,
      },
    ],
    subtotal: 1200,
    shipping: 50,
    grandTotal: 1250,
  });

  assert.match(message, /Order Number: NH202611131234560001/);
  assert.match(message, /Order Date: 13 November 2026/);
  assert.match(message, /Current Status: Order Shipped/);
  assert.match(message, /Temple Necklace \| Qty: 2 \| Unit: ₹600 \| Amount: ₹1,200/);
  assert.match(message, /Grand Total: ₹1,250/);
});

test("normalizes order items and formats invoice amounts", () => {
  assert.deepEqual(
    normalizeTrackingOrderItems([
      {
        product_name: "Temple Necklace",
        quantity: "2",
        price: "600",
        amount: "1200",
      },
    ]),
    [
      {
        productName: "Temple Necklace",
        quantity: 2,
        unitPrice: 600,
        amount: 1200,
      },
    ]
  );
  assert.equal(formatTrackingPrice(1250), "₹1,250");
  assert.equal(
    normalizeTrackingOrderItems([
      {
        product_name: " ",
        quantity: "2",
        price: "600",
        amount: "1200",
      },
    ]),
    null
  );
});

test("does not expose database error details", async () => {
  const result = await verifyTrackingRequest(
    ORDER_ONE.order_no,
    "9876543210",
    async () => ({ order: null, error: new Error("private database detail") })
  );

  assert.deepEqual(result, { kind: "database-error" });
  assert.equal(JSON.stringify(result).includes("private database detail"), false);
});

test("rate limits attempts after the configured threshold", () => {
  for (let count = 1; count <= ORDER_LOOKUP_MAX_ATTEMPTS; count += 1) {
    assert.equal(isOrderLookupRateLimited(count), false);
  }
  assert.equal(
    isOrderLookupRateLimited(ORDER_LOOKUP_MAX_ATTEMPTS + 1),
    true
  );
});
