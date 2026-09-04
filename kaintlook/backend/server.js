const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const couponRoutes = require("./routes/couponRoutes");
const addressRoutes = require("./routes/addressRoutes");
const userRoutes = require("./routes/userRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const myReviewsRoutes = require("./routes/myReviewsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const Product = require("./models/Product");
const Category = require("./models/Category");

const app = express();
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});
app.use(express.json({ limit: "100kb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use((req, res, next) => {
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (process.env.NODE_ENV === "production" && body && typeof body === "object") {
      delete body.error;
    }
    return sendJson(body);
  };
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/products/:productId/reviews", reviewRoutes);
app.use("/api/reviews", myReviewsRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/users", userRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => res.send("KaintLook API running"));
app.get("/api/health", (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    status: connected ? "ok" : "degraded",
    server: "healthy",
    database: connected ? "connected" : "disconnected",
  });
});

const xmlEscape = (value) => String(value).replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[character]));
const siteUrl = (process.env.SITE_URL || process.env.APP_URL || "http://localhost:5173").replace(/\/$/, "");

app.get("/robots.txt", (req, res) => {
  res.type("text/plain").send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /account\nDisallow: /cart\nDisallow: /checkout\nDisallow: /orders\nDisallow: /login\nDisallow: /register\nDisallow: /forgot-password\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
});

app.get("/sitemap.xml", async (req, res) => {
  try {
    const [products, categories] = await Promise.all([
      Product.find().select("_id updatedAt").lean(),
      Category.find().select("slug updatedAt").lean(),
    ]);
    const urls = [
      { loc: `${siteUrl}/`, priority: "1.0" },
      { loc: `${siteUrl}/shop`, priority: "0.8" },
      ...categories.map((category) => ({ loc: `${siteUrl}/category/${encodeURIComponent(category.slug)}`, lastmod: category.updatedAt, priority: "0.6" })),
      ...products.map((product) => ({ loc: `${siteUrl}/products/${product._id}`, lastmod: product.updatedAt, priority: "0.8" })),
    ];
    const body = urls.map((url) => `<url><loc>${xmlEscape(url.loc)}</loc>${url.lastmod ? `<lastmod>${new Date(url.lastmod).toISOString()}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>${url.priority}</priority></url>`).join("");
    res.type("application/xml").send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
  } catch (err) {
    res.status(503).type("text/plain").send("Sitemap temporarily unavailable");
  }
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.statusCode || 500;
  if (process.env.NODE_ENV !== "production") console.error(err);
  res.status(status).json({ message: status === 500 ? "Internal server error" : err.message });
});

const PORT = process.env.PORT || 5000;
let server;

mongoose.connection.on("error", (err) => console.error("MongoDB connection error:", err.message));
mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected; waiting for reconnect"));

mongoose
  .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
  .then(() => {
    console.log("MongoDB connected");
    server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exitCode = 1;
  });

const shutdown = async (signal) => {
  console.log(`${signal} received; shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
};

process.once("SIGINT", () => shutdown("SIGINT").finally(() => process.exit()));
process.once("SIGTERM", () => shutdown("SIGTERM").finally(() => process.exit()));