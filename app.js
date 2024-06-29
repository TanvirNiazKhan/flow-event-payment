const express = require('express');
const bodyParser = require('body-parser');
const SSLCommerzPayment = require('sslcommerz-lts');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Middleware
app.use(cors({}))
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Root route
app.get('/', async (req, res) => {
  return res.status(200).json({
    message: "Welcome to sslcommerz app",
    url: `${process.env.ROOT}/ssl-request`
  });
});

// Details route (for receiving post from React component)
let amount = 0, user_name, user_email, payment_number, event_name,event_id;
app.post('/details', async (req, res) => {
  console.log("here", req.body); 
  amount = Number(req.body.event_fee);
  user_email = req.body.user_email;
  payment_number = req.body.event_contact;
  user_name = req.body.user_name;
  event_name = req.body.event_name;
  event_id = req.body.event_id;

  // Return JSON response
  return res.status(200).json({
    message: "Received data successfully",
    redirectUrl: 'http://localhost:8080/ssl-request'
  });
});

// SSLCommerz initialization and payment request
app.get('/ssl-request', async (req, res) => {
  const data = {
    total_amount: amount ? amount : "200",
    currency: 'BDT',
    tran_id: 'REF123',
    success_url: `${process.env.ROOT}/ssl-payment-success`,
    fail_url: `${process.env.ROOT}/ssl-payment-fail`,
    cancel_url: `${process.env.ROOT}/ssl-payment-cancel`,
    shipping_method: 'No',
    product_name: 'Laptop',
    product_category: 'Electronic',
    product_profile: 'general',
    cus_name: user_name ? user_name : "Tanvir",
    cus_email: user_email ? user_email : "niaz@gmail.com",
    cus_add1: 'Dhaka',
    cus_add2: 'Dhaka',
    cus_city: 'Dhaka',
    cus_state: 'Dhaka',
    cus_postcode: '1000',
    cus_country: 'Bangladesh',
    cus_phone: '01711111111',
    cus_fax: '01711111111',
    multi_card_name: 'mastercard',
    value_a: 'ref001_A',
    value_b: 'ref002_B',
    value_c: 'ref003_C',
    value_d: 'ref004_D',
    ipn_url: `${process.env.ROOT}/ssl-payment-notification`,
  };

  const sslcommerz = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD, false);
  sslcommerz.init(data).then(data => {
    console.log(data);
    if (data?.GatewayPageURL) {
      return res.status(200).redirect(data?.GatewayPageURL);
    } else {
      return res.status(400).json({
        message: "Session was not successful"
      });
    }
  }).catch(error => {
    console.error("Error initializing SSLCommerz:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  });
});

// SSLCommerz payment callbacks
app.post("/ssl-payment-notification", async (req, res) => {
  console.log("Payment notification received:", req.body);
  return res.status(200).json({
    data: req.body,
    message: 'Payment notification'
  });
});

app.post("/ssl-payment-success", async (req, res) => {
  console.log("Payment success:", req.body);
  // Redirect to event page
  res.redirect(`${process.env.FRONTEND_ROOT}/event/${event_id}`);
});

app.post("/ssl-payment-fail", async (req, res) => {
  console.log("Payment failed:", req.body);
  return res.status(200).json({
    data: req.body,
    message: 'Payment failed'
  });
});

app.post("/ssl-payment-cancel", async (req, res) => {
  console.log("Payment cancelled:", req.body);
  return res.status(200).json({
    data: req.body,
    message: 'Payment cancelled'
  });
});

// Start server
app.listen(process.env.PORT, () =>
  console.log(`ssl app listening on port ${process.env.PORT}!`),
);
