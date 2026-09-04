const Category = require("../models/Category");
const categoryFields = ["name", "slug", "image", "parentCategory"];
const pickCategory = (body) => Object.fromEntries(categoryFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

// @route GET /api/categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories", error: err.message });
  }
};

// @route POST /api/categories (admin only)  { name, slug, image }
const createCategory = async (req, res) => {
  try {
    const category = await Category.create(pickCategory(req.body));
    res.status(201).json(category);
  } catch (err) {
    res.status(400).json({ message: "Failed to create category", error: err.message });
  }
};

// @route PUT /api/categories/:id (admin only)
const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, pickCategory(req.body), { new: true, runValidators: true });
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json(category);
  } catch (err) {
    res.status(400).json({ message: "Failed to update category", error: err.message });
  }
};

// @route DELETE /api/categories/:id (admin only)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category", error: err.message });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
