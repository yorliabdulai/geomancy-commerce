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
app.use(cors());

app.get("/", (req, res) => {
    res.send("Welcome to Geomancy-Shop");
});

const calculateOrderAmount = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Items array is required to calculate order amount");
    }

    const newArray = items.map((item) => {
        const { price, qty } = item;
        return price * qty;
    });

    const totalCartAmount = newArray.reduce((total, curr) => total + curr, 0);
    return totalCartAmount; // Assuming the amount is in kobo or the lowest denomination of your currency
};


app.post("/initialize-transaction", async (req, res) => {
    const { items, shippingAddress, description, email } = req.body;
    const amount = calculateOrderAmount(items) * 100; // Convert to kobo if necessary

    try {
        // Initialize transaction with Paystack
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            {
                email: email,
                amount: amount,
                currency: 'NGN',
                callback_url: 'http://localhost:5173/callback', // Replace with your actual callback URL
                metadata: {
                    shippingAddress,
                    description
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Send the Paystack transaction URL to the frontend
        res.send({
            authorization_url: response.data.data.authorization_url
        });
    } catch (error) {
        console.error('Error initializing transaction:', error);
        res.status(500).send({ error: 'Transaction initialization failed' });
    }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`));
