// Shared helpers for the color+size variant system. Centralising this logic
// means the "what's the stock status of X" question is answered exactly the
// same way everywhere (product page, cart, checkout, admin) — no risk of the
// frontend and backend (or two backend routes) disagreeing on the rules.

const hasVariants = (product) => Array.isArray(product?.variants) && product.variants.length > 0;

// "in_stock" | "low_stock" | "out_of_stock", given a raw stock count.
const stockStatus = (stock, threshold = 5) => {
  const s = Number(stock) || 0;
  const t = Number(threshold) || 0;
  if (s <= 0) return "out_of_stock";
  if (s <= t) return "low_stock";
  return "in_stock";
};

const findVariant = (product, colorName) =>
  (product.variants || []).find((v) => v.colorName === colorName);

const findSizeRow = (variant, size) =>
  (variant?.sizes || []).find((s) => s.size === size);

// Resolve "how much of this exact color+size is available right now", and the
// effective unit price for it (a variant/size can optionally override price).
// Works for legacy (no-variant) products too, where colorName/size are "".
const resolveStock = (product, colorName, size) => {
  if (!hasVariants(product)) {
    return { stock: product.stock ?? 0, price: product.price, sku: "", found: true };
  }
  const variant = findVariant(product, colorName);
  if (!variant) return { stock: 0, price: product.price, sku: "", found: false };
  const row = findSizeRow(variant, size);
  if (!row) return { stock: 0, price: product.price, sku: "", found: false };
  return { stock: row.stock ?? 0, price: row.price ?? product.price, sku: row.sku || "", found: true };
};

// Basic shape validation for the `variants` array coming from the admin form.
// Throws a plain Error with a human-readable message on the first problem found.
const validateVariants = (variants) => {
  if (variants === undefined) return;
  if (!Array.isArray(variants)) throw new Error("Variants must be a list");
  const hexRe = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
  const seenColors = new Set();
  for (const v of variants) {
    if (!v.colorName || !v.colorName.trim()) throw new Error("Each variant needs a color name");
    const key = v.colorName.trim().toLowerCase();
    if (seenColors.has(key)) throw new Error(`Duplicate color: ${v.colorName}`);
    seenColors.add(key);
    if (!v.colorCode || !hexRe.test(v.colorCode)) throw new Error(`"${v.colorName}" needs a valid color code (e.g. #FF69B4)`);
    if (!Array.isArray(v.sizes) || v.sizes.length === 0) throw new Error(`"${v.colorName}" needs at least one size`);
    const seenSizes = new Set();
    for (const s of v.sizes) {
      if (!s.size || !String(s.size).trim()) throw new Error(`"${v.colorName}" has a size with no name`);
      const sizeKey = String(s.size).trim().toUpperCase();
      if (seenSizes.has(sizeKey)) throw new Error(`"${v.colorName}" has duplicate size "${s.size}"`);
      seenSizes.add(sizeKey);
      if (s.stock === undefined || Number(s.stock) < 0 || !Number.isFinite(Number(s.stock))) {
        throw new Error(`"${v.colorName} / ${s.size}" needs a valid stock number`);
      }
    }
  }
};

module.exports = { hasVariants, stockStatus, findVariant, findSizeRow, resolveStock, validateVariants };