import assert from "node:assert/strict";
import test from "node:test";
import { normalizeIndianMobileNumber } from "../lib/indian-mobile.ts";
import {
  buildConfirmationMessage,
  buildStatusMessage,
} from "../lib/orderMessages.ts";

const ORDER = {
  order_no: "NH202611191234560001",
  customer_name: "Priya Sharma",
  subtotal: 2500,
  shipping: 100,
  grand_total: 2600,
  address: "12 Example Street",
  pincode: "600001",
};

test("normalizes Indian mobile prefixes and rejects invalid starting digits", () => {
  assert.equal(normalizeIndianMobileNumber("+91 98765-43210"), "9876543210");
  assert.equal(normalizeIndianMobileNumber("91 87654 32100"), "8765432100");
  assert.equal(normalizeIndianMobileNumber("09876543210"), "9876543210");
  assert.equal(normalizeIndianMobileNumber("5123456789"), null);
});

test("builds a confirmation message with formatted totals and delivery details", () => {
  const message = buildConfirmationMessage(ORDER, [
    { product_name: "Temple necklace", quantity: 2, amount: 2400 },
  ]);

  assert.match(message, /^Hi Priya, thank you for ordering from Nikshas Collections!/);
  assert.match(message, /• Temple necklace × 2 – ₹2,400/);
  assert.match(message, /Subtotal ₹2,500, shipping ₹100, total ₹2,600/);
  assert.match(message, /Delivery to: 12 Example Street, 600001/);
  assert.match(message, /Please reply YES to confirm/);
});

test("keeps long confirmation messages under 1,000 characters and shortens the item list", () => {
  const items = Array.from({ length: 60 }, (_, index) => ({
    product_name: `Product ${index} ${"long name ".repeat(20)}`,
    quantity: 1,
    amount: 100,
  }));
  const message = buildConfirmationMessage(ORDER, items);

  assert.ok(message.length < 1000);
  assert.match(message, /and \d+ more/);
});

test("builds dispatched status messages with available shipment details", () => {
  const message = buildStatusMessage(
    { ...ORDER, courier: "Example Courier", tracking_number: "TRACK123" },
    "Dispatched"
  );

  assert.match(message, /your order NH202611191234560001 has been dispatched/);
  assert.match(message, /Example Courier/);
  assert.match(message, /TRACK123/);
});

test("builds accepted, complete, and cancelled status messages", () => {
  assert.match(
    buildStatusMessage(ORDER, "Accepted"),
    /your order NH202611191234560001 is confirmed and being packed/
  );
  assert.match(
    buildStatusMessage(ORDER, "Complete"),
    /thank you for shopping with us!/
  );
  assert.match(
    buildStatusMessage(ORDER, "Cancelled"),
    /your order NH202611191234560001 has been cancelled; message us if you have any questions/
  );
});
