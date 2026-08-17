import assert from 'node:assert';

/**
 * TC-21 Regression Test: Detailed Bank Transaction Description for Payment & Receipt Vouchers
 */

export function buildTransactionDescription(type, ledgerName, itemName) {
  const secondType = type === 'purchase' ? 'payment' : type === 'sale' ? 'receipt' : type;
  const itemDesc = itemName?.trim() ? itemName.trim() : (secondType === 'payment' ? 'Balance Settlement' : 'Balance Settlement');
  
  if (secondType === 'payment') {
    return {
      description: `Payment to ${ledgerName} — ${itemDesc}${itemName?.trim() ? ' (Purchase)' : ''}`,
      vendorOrCustomerName: ledgerName,
      relatedItemName: itemDesc,
    };
  } else {
    return {
      description: `Receipt from ${ledgerName} — ${itemDesc}${itemName?.trim() ? ' (Sale)' : ''}`,
      vendorOrCustomerName: ledgerName,
      relatedItemName: itemDesc,
    };
  }
}

// Test TC-21 Case 1: Purchase ₹50,000 Laptop from Ramesh Traders with Pay Now ₹25,000
const tc04Purchase = buildTransactionDescription('purchase', 'Ramesh Traders', 'Laptop');

assert.strictEqual(
  tc04Purchase.description,
  'Payment to Ramesh Traders — Laptop (Purchase)',
  'TC-21 Case 1 Failure: Incorrect bank transaction description for Purchase with Pay Now'
);
assert.strictEqual(tc04Purchase.vendorOrCustomerName, 'Ramesh Traders');
assert.strictEqual(tc04Purchase.relatedItemName, 'Laptop');

console.log('✓ TC-21 Case 1 Passed: "Payment to Ramesh Traders — Laptop (Purchase)"');

// Test TC-21 Case 2: Standalone Payment without linked item (Balance Settlement)
const standalonePayment = buildTransactionDescription('payment', 'Vendor 1', null);

assert.strictEqual(
  standalonePayment.description,
  'Payment to Vendor 1 — Balance Settlement',
  'TC-21 Case 2 Failure: Incorrect description for Standalone Payment'
);
assert.strictEqual(standalonePayment.vendorOrCustomerName, 'Vendor 1');
assert.strictEqual(standalonePayment.relatedItemName, 'Balance Settlement');

console.log('✓ TC-21 Case 2 Passed: "Payment to Vendor 1 — Balance Settlement"');

// Test TC-21 Case 3: Sale ₹1,00,000 Finished Goods to Priya Enterprises with Receive Now
const saleReceipt = buildTransactionDescription('sale', 'Priya Enterprises', 'Laptop');

assert.strictEqual(
  saleReceipt.description,
  'Receipt from Priya Enterprises — Laptop (Sale)',
  'TC-21 Case 3 Failure: Incorrect bank transaction description for Sale with Receive Now'
);
assert.strictEqual(saleReceipt.vendorOrCustomerName, 'Priya Enterprises');
assert.strictEqual(saleReceipt.relatedItemName, 'Laptop');

console.log('✓ TC-21 Case 3 Passed: "Receipt from Priya Enterprises — Laptop (Sale)"');

console.log('\nSUCCESS: All TC-21 Transaction Description tests passed cleanly!');
