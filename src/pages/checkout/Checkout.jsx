import React, { useState, useEffect } from "react";
import Loader from "../../components/loader/Loader";
import { useSelector, useDispatch } from "react-redux";
import { calculateSubtotal, calculateTotalQuantity, clearCart } from "../../redux/slice/cartSlice";
import { formatPrice } from "../../utils/formatPrice";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./paystack.css";

const Checkout = () => {
    const { cartItems, totalQuantity, totalAmount } = useSelector((store) => store.cart);
    const { shippingAddress } = useSelector((store) => store.checkout);
    const { email, userId } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(calculateSubtotal());
        dispatch(calculateTotalQuantity());
    }, [dispatch, cartItems]);

    const [isLoading, setIsLoading] = useState(false);

    const saveOrder = async () => {
        const orderDetails = {
            userId,
            email,
            orderDate: new Date().toDateString(),
            orderTime: new Date().toLocaleTimeString(),
            orderAmount: totalAmount,
            orderStatus: "Order Placed",
            cartItems,
            shippingAddress,
            createdAt: Timestamp.now(),
        };
        try {
            await addDoc(collection(db, "orders"), orderDetails);
            dispatch(clearCart());
            toast.success("Order saved successfully!");
        } catch (error) {
            console.error("Error saving order:", error);
            toast.error("Failed to save order. Please contact support.");
        }
    };

    const initializeTransaction = async () => {
        try {
            const response = await fetch("http://localhost:3000/initialize-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        price: Math.round(item.price),
                        qty: item.qty,
                    })),
                    email,
                    shippingAddress,
                    amount: totalAmount,
                    description: `Payment of ${formatPrice(totalAmount)} from ${email}`,
                }),
            });

            const data = await response.json();
            return data.authorization_url;
        } catch (error) {
            console.error("Error initializing transaction:", error);
            setIsLoading(false);
            throw error;
        }
    };

    const verifyTransaction = async (reference) => {
        try {
            const response = await fetch(`http://localhost:3000/verify-transaction?reference=${reference}`);
            const data = await response.json();

            if (data.success) {
                await saveOrder(); // Save the order after successful payment
                toast.success("Payment successful!");
                navigate("/checkout-success");
            } else {
                toast.error("Transaction verification failed.");
            }
        } catch (error) {
            console.error("Error verifying transaction:", error);
            toast.error("Error verifying payment.");
        }
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const reference = urlParams.get('reference');

        if (reference) {
            verifyTransaction(reference); // Verify transaction after redirection
        }
    }, []);

    const handlePaystackPayment = async () => {
        setIsLoading(true);
        try {
            const authorizationUrl = await initializeTransaction();

            if (authorizationUrl) {
                window.location.href = authorizationUrl;
            } else {
                console.error("Authorization URL not retrieved.");
                setIsLoading(false);
            }
        } catch (error) {
            console.error("Payment failed:", error);
            setIsLoading(false);
        }
    };

    return (
        <main>
            {isLoading && <Loader />}
            <div className="rounded-md shadow-xl pt-4 pb-8 px-10">
                <h1 className="text-3xl font-light mb-2">Paystack Checkout</h1>
                <button onClick={handlePaystackPayment} disabled={isLoading} className="btn bg-blue-600 paystack-button">
                    {isLoading ? "Processing..." : "Pay Now"}
                </button>
            </div>
        </main>
    );
};

export default Checkout;
