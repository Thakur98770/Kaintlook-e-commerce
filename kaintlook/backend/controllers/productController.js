const Product = require("../models/Product");
const mongoose = require("mongoose");
const productFields = ["name", "code", "description", "category", "subcategory", "price", "unit", "stock", "images", "tag"];
const pickProduct = (body) => Object.fromEntries(productFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @route GET /api/products
// Supports ?category=&search=&sort=low|high|az&minPrice=&maxPrice=&minRating=&page=&limit=
const getProducts = async (req, res) => {
  try {
    const { category, subcategory, tag, search, sort, minPrice, maxPrice, minRating, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (subcategory) filter.subcategory = subcategory;
    if (tag && ["New", "Bestseller", "Sale"].includes(tag)) filter.tag = tag;
    if (search) filter.$text = { $search: search };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (minRating) filter.rating = { $gte: Number(minRating) };

    let query = Product.find(filter);

    if (sort === "low") query = query.sort({ price: 1 });
    else if (sort === "high") query = query.sort({ price: -1 });
    else if (sort === "az") query = query.sort({ name: 1 });
    else if (sort === "rating") query = query.sort({ rating: -1 });
    else query = query.sort({ createdAt: -1 });

    const pageNumber = Number.parseInt(page, 10);
    const limitNumber = Number.parseInt(limit, 10);
    if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 100) {
      return res.status(400).json({ message: "Page must be positive and limit must be between 1 and 100" });
    }
    if ((minPrice && (!Number.isFinite(Number(minPrice)) || Number(minPrice) < 0)) || (maxPrice && (!Number.isFinite(Number(maxPrice)) || Number(maxPrice) < 0))) {
      return res.status(400).json({ message: "Invalid price filter" });
    }
    const skip = (pageNumber - 1) * limitNumber;
    const [products, total] = await Promise.all([
      query.skip(skip).limit(limitNumber),
      Product.countDocuments(filter),
    ]);

    res.json({ products, total, page: pageNumber, pages: Math.ceil(total / limitNumber) });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products", error: err.message });
  }
};

// @route GET /api/products/suggest?q=
// Lightweight autocomplete — partial name matches, capped small for a dropdown.
const getProductSuggestions = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);

    const products = await Product.find({ name: { $regex: escapeRegex(q), $options: "i" } })
      .select("name category price images")
      .limit(6);

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch suggestions", error: err.message });
  }
};

// @route GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product" });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product", error: err.message });
  }
};

// @route POST /api/products (admin only)
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(pickProduct(req.body));
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: "Failed to create product", error: err.message });
  }
};

// @route PUT /api/products/:id (admin only)
const updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid product" });
    const product = await Product.findByIdAndUpdate(req.params.id, pickProduct(req.body), { new: true, runValidators: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: "Failed to update product", error: err.message });
  }
};

// @route DELETE /api/products/:id (admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete product", error: err.message });
  }
};

module.exports = {
  getProducts,
  getProductSuggestions,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
