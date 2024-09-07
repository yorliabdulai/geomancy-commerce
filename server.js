require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const axios = require("axios");
const { addDoc, collection, Timestamp } = require("firebase/firestore"); // Firestore methods
const { db } = require("././src/firebase/config"); // Firestore configuration
const app = express();

if (process.env.NODE_ENV === "production") {
    app.use(express.static("build"));
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__dirname, "build", "index.html"));
    });
}

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization'
}));

app.get("/", (req, res) => {
    res.send("Welcome to Geomancy-Shop");
});

const calculateOrderAmount = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Items array is required to calculate order amount");
    }

    const totalCartAmountGHS = items.reduce((total, item) => {
        const { price, qty } = item;
        return total + (price * qty);
    }, 0);

    const totalAmountInGhanaCedis = totalCartAmountGHS * 100;
    return totalAmountInGhanaCedis;
};

app.post("/initialize-transaction", async (req, res) => {
    console.log(req.body);
    const { items, shippingAddress, description, email } = req.body;

    if (!items || items.length === 0) {
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
                currency: "GHS",
                callback_url: "http://localhost:5173/checkout-success",
                metadata: {
                    shippingAddress,
                    description,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Save the order to Firestore
        const orderDetails = {
            email,
            items,
            amount,
            shippingAddress,
            description,
            orderStatus: "Pending Payment",
            orderDate: new Date().toISOString(),
            createdAt: Timestamp.now(),
        };

        const docRef = await addDoc(collection(db, "orders"), orderDetails);
        console.log("Order saved with ID:", docRef.id);

        // Send the Paystack transaction URL to the frontend
        res.send({
            authorization_url: response.data.data.authorization_url,
        });

    } catch (error) {
        console.error("Error initializing transaction or saving order:", error.response?.data || error.message);
        res.status(500).send({ error: "Transaction initialization or order saving failed" });
    }
});

// Verify transaction after successful payment
app.get("/verify-transaction", async (req, res) => {
    const reference = req.query.reference;
    console.log("Received transaction reference:", reference);

    try {
        const response = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            },
        });

        const { status, data } = response.data;
        console.log("Transaction verification response:", response.data);

        if (status === "success") {
            // Update order status to "Paid" in Firestore
            const orderRef = collection(db, "orders").doc(reference);
            await orderRef.update({
                orderStatus: "Paid",
            });
            res.json({ success: true, message: "Transaction verified successfully", data });
        } else {
            console.error("Transaction verification failed:", status);
            res.status(400).json({ success: false, message: "Transaction verification failed" });
        }
    } catch (error) {
        console.error("Error verifying transaction:", error.response?.data || error.message);
        res.status(500).send({ error: "Failed to verify transaction" });
    }
});

const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Node server listening on port ${PORT}!`));
