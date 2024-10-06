import React, { useState, useEffect } from "react";
import Loader from "../../components/loader/Loader";
import { useSelector, useDispatch } from "react-redux";
import { calculateSubtotal, calculateTotalQuantity, clearCart } from "../../redux/slice/cartSlice";
import { formatPrice } from "../../utils/formatPrice";
import { collection, addDoc, Timestamp, setDoc, doc } from "firebase/firestore";
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

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        dispatch(calculateSubtotal());
        dispatch(calculateTotalQuantity());
    }, [dispatch, cartItems]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const reference = urlParams.get('reference');

        if (reference) {
            console.log("Payment reference found:", reference);
            verifyTransaction(reference);
        }
    }, []);

    const saveOrder = async (orderDetails) => {
        if (!orderDetails.email) {
            console.error("User email not found. Cannot save order.");
            toast.error("User email not found. Cannot save order.");
            return null;
        }

        try {
            const docRef = await addDoc(collection(db, "orders"), {
                ...orderDetails,
                createdAt: Timestamp.now().toDate(),
            });
            console.log("Order saved with ID:", docRef.id);
            toast.success("Order saved successfully!");
            return docRef.id;
        } catch (error) {
            console.error("Error saving order to Firestore:", error);
            toast.error("Failed to save order. Please try again.");
            return null;
        }
    };

    const handlePaystackPayment = async () => {
        setIsLoading(true);
        try {
            const response = await fetch("https://geomancy-commerce.onrender.com/initialize-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        price: item.price,
                        qty: item.qty,
                    })),
                    email,
                    shippingAddress,
                    amount: totalAmount * 100,
                    description: `Payment of ${formatPrice(totalAmount)} from ${email}`,
                }),
            });

            const data = await response.json();
            console.log("Payment initialization response:", data);

            if (data.authorization_url) {
                // Save the order details before redirecting
                const orderDetails = {
                    email,
                    userId: userId || "guest",
                    orderDate: new Date().toISOString(),
                    orderAmount: totalAmount,
                    orderStatus: "Pending Payment",
                    cartItems,
                    shippingAddress,
                };

                const orderId = await saveOrder(orderDetails);
                
                if (orderId) {
                    // Store the orderId in session storage for later use
                    sessionStorage.setItem('pendingOrderId', orderId);
                    console.log("Redirecting to:", data.authorization_url);
                    window.location.href = data.authorization_url;
                } else {
                    throw new Error("Failed to save order");
                }
            } else {
                console.error("Authorization URL not retrieved.");
                toast.error("Failed to initiate payment. Please try again.");
            }
        } catch (error) {
            console.error("Payment process failed:", error);
            toast.error("Failed to process payment. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const verifyTransaction = async (reference) => {
        console.log("Verifying transaction with reference:", reference);
        try {
            const response = await fetch(`https://geomancy-commerce.onrender.com/verify-transaction?reference=${reference}`);
            const data = await response.json();
            console.log("Verification response:", data);

            if (data.success) {
                console.log("Transaction verified successfully");
                // Retrieve the pending order ID from session storage
                const pendingOrderId = sessionStorage.getItem('pendingOrderId');
                
                if (pendingOrderId) {
                    // Update the order status to "Completed"
                    await updateOrderStatus(pendingOrderId, "Completed");
                    dispatch(clearCart());
                    sessionStorage.removeItem('pendingOrderId');
                    toast.success("Payment successful and order completed!");
                    navigate("/checkout-success");
                } else {
                    throw new Error("Pending order ID not found");
                }
            } else {
                console.error("Transaction verification failed:", data.message);
                toast.error("Transaction verification failed.");
            }
        } catch (error) {
            console.error("Error verifying transaction:", error);
            toast.error("Error verifying payment.");
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await setDoc(doc(db, "orders", orderId), { 
                orderStatus: newStatus,
                updatedAt: Timestamp.now().toDate()
            }, { merge: true });
            console.log(`Order status updated to ${newStatus} successfully`);
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error("Failed to update order status. Please contact support.");
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