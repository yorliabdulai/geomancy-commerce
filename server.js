require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios"); // Add axios for making HTTP requests
const app = express();

if (process.env.NODE_ENV === "production") {
    app.use(express.static("build"));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "build", "index.html"));
    });
}

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Allow only your frontend
    methods: 'GET,POST,PUT,DELETE,OPTIONS',  // Specify the allowed methods
    allowedHeaders: 'Content-Type,Authorization' // Specify allowed headers
}));

app.get("/", (req, res) => {
    res.send("Welcome to Geomancy-Shop");
});

const calculateOrderAmount = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Items array is required to calculate order amount");
    }

    // Calculate total amount in GHS
    const totalCartAmountGHS = items.reduce((total, item) => {
        const { price, qty } = item; // Ensure price is in GHS
        return total + (price * qty); // Sum the total price
    }, 0);

    // Convert to the smallest currency unit (Ghanaian Ghanas)
    const totalAmountInGhanaCedis = totalCartAmountGHS * 100; // Convert to GHS

    return totalAmountInGhanaCedis; // Return total in GHS
};


app.post("/initialize-transaction", async (req, res) => {
    console.log(req.body);
    const { items, shippingAddress, description, email } = req.body;
    if (!items) {
        return res.status(400).send({ error: "No items found in request" });
    }
    const amount = calculateOrderAmount(items);
    try {
        // Initialize transaction with Paystack
        const response = await axios.post(
            "https://api.paystack.co/transaction/initialize",
            {
                email: email,
                amount: amount,
                currency: "GHS", // Change to your desired currency if different
                callback_url: "http://localhost:5173/checkout-success", // Replace with your actual callback URL
                metadata: {
                    shippingAddress,
                    description,
                },
            },
            {
                headers: {
                    Authorization: `Bearer sk_test_21caa1235e207b235bd4a5de86961a16b2feedf9`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Send the Paystack transaction URL to the frontend
        res.send({
            authorization_url: response.data.data.authorization_url,
        });
    } catch (error) {
        console.error("Error initializing transaction:", error.response?.data || error.message);
        res.status(500).send({ error: "Transaction initialization failed" });
    }
});
// Verify transaction after successful payment
app.get("/verify-transaction", async (req, res) => {
    const reference = req.query.reference;

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer sk_test_21caa1235e207b235bd4a5de86961a16b2feedf9`,
            },
        });

        const { status, data } = response.data;

        if (status === "success") {
            // Handle transaction success here (save order in the database, etc.)
            res.json({ success: true, message: "Transaction verified successfully", data });
        } else {
            res.status(400).json({ success: false, message: "Transaction verification failed" });
        }
    } catch (error) {
        console.error("Error verifying transaction:", error.response?.data || error.message);
        res.status(500).send({ error: "Failed to verify transaction" });
    }
});


const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`));
