const express = require("express");
const app = express();
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

// Middleware
app.use(express.json());

// CORS Headers
/*
  app.use((req, res, next) => {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://aly-training.myshopify.com"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });
*/

app.use(bodyParser.json());

const CORS_ALLOW_LIST = process.env.CORS_ALLOW_LIST?.split(",") || [
  "https://aly-training.myshopify.com",
  "https://9eece0-ab.myshopify.com",
];

app.use(function (req, res, next) {
  const allowList = CORS_ALLOW_LIST;
  const origin = req.headers.origin || "";
  if (allowList.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

// Track Order Route
app.post("/track-order", async (req, res) => {
  const { orderNumber, customerName } = req.body;

  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN;
  const accessToken = process.env.SHOPIFY_ADMIN_TOKEN;

  try {
    // Search for the order
    const response = await axios.get(
      `https://${storeDomain}/admin/api/2023-10/orders.json?name=${orderNumber}`,
      {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      }
    );

    const orders = response.data.orders;

    if (orders.length === 0) {
      return res.json({ success: false, message: "Order not found" });
    }

    const order = orders[0];
    // Optional: Verify customer name matches
    if (
      !order.customer ||
      !order.customer.first_name
        .toLowerCase()
        .includes(customerName.toLowerCase())
    ) {
      console.log(
        `Customer name does not match: ${order.customer.first_name} vs ${customerName}`
      );
      return res.json({
        success: false,
        message: "Customer name does not match",
      });
    }

    /*
      // Get tracking info
      const fulfillments = order.fulfillments;
      if (!fulfillments || fulfillments.length === 0) {
        return res.json({
          success: false,
          message: "No tracking information available",
        });
      }

      const trackingInfo =
        fulfillments[0].tracking_numbers.length > 0
          ? {
              trackingNumber: fulfillments[0].tracking_numbers[0],
              courier: fulfillments[0].tracking_company,
              status: fulfillments[0].shipment_status || "Unknown",
              estimatedDelivery: fulfillments[0].created_at, // Or another field if available
            }
          : null;

      if (!trackingInfo) {
        return res.json({
          success: false,
          message: "Tracking information is missing",
        });
      }
    */

    return res.json({ success: true, order });
    // return res.json({ success: true, ...trackingInfo });
  } catch (error) {
    console.error(
      "Error fetching order:",
      error.response?.data || error.message
    );
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
