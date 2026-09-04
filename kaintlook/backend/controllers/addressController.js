const Address = require("../models/Address");
const addressFields = ["fullName", "line1", "line2", "landmark", "city", "state", "pincode", "phone", "addressType", "isDefault"];
const pickAddress = (body) => Object.fromEntries(addressFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

// @route GET /api/addresses
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch addresses", error: err.message });
  }
};

// @route POST /api/addresses
const addAddress = async (req, res) => {
  try {
    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }
    const address = await Address.create({ ...pickAddress(req.body), user: req.user._id });
    res.status(201).json(address);
  } catch (err) {
    res.status(400).json({ message: "Failed to add address", error: err.message });
  }
};

// @route PUT /api/addresses/:id
const updateAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });

    if (req.body.isDefault) {
      await Address.updateMany({ user: req.user._id }, { isDefault: false });
    }

    Object.assign(address, pickAddress(req.body));
    await address.save();
    res.json(address);
  } catch (err) {
    res.status(400).json({ message: "Failed to update address", error: err.message });
  }
};

// @route DELETE /api/addresses/:id
const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!address) return res.status(404).json({ message: "Address not found" });
    res.json({ message: "Address deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete address", error: err.message });
  }
};

module.exports = { getAddresses, addAddress, updateAddress, deleteAddress };
