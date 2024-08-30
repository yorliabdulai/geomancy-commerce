import React, { useState, useEffect } from "react";
import Loader from "../../components/loader/Loader";
import { useSelector, useDispatch } from "react-redux";
import { calculateSubtotal, calculateTotalQuantity, clearCart } from "../../redux/slice/cartSlice";
import { formatPrice } from "../../utils/formatPrice";
import PaystackPop from '@paystack/inline-js';
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const CheckoutForm = () => {
    const { cartItems, totalQuantity, totalAmount } = useSelector((store) => store.cart);
    const { shippingAddress, billingAddress } = useSelector((store) => store.checkout);
    const { email, userId } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [accessCode, setAccessCode] = useState("");

    useEffect(() => {
        dispatch(calculateSubtotal());
        dispatch(calculateTotalQuantity());
    }, [dispatch, cartItems]);

    const description = `Payment of ${formatPrice(totalAmount)} from ${email}`;

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
            billingAddress,
            createdAt: Timestamp.now().toDate(),
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
                    email: email,
                    amount: totalAmount * 100,
                    description: description,
                    shippingAddress: shippingAddress,
                    billingAddress: billingAddress,
                }),
            });
            const data = await response.json();
            if (data.accessCode) {
                setAccessCode(data.accessCode);
            } else {
                throw new Error("Failed to get access code");
            }
        } catch (error) {
            console.error("Error initializing transaction:", error);
            toast.error("Transaction initialization failed. Please try again.");
        }
    };

    const handlePaystackPayment = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        await initializeTransaction();

        if (accessCode) {
            const paystack = new PaystackPop();
            paystack.popup({
                key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
                email: email,
                amount: totalAmount * 100,
                currency: "GHS",
                ref: `${email}-${Date.now()}`,
                metadata: {
                    custom_fields: [
                        { display_name: "Shipping Address", variable_name: "shipping_address", value: shippingAddress },
                        { display_name: "Billing Address", variable_name: "billing_address", value: billingAddress }
                    ]
                },
                callback: function (response) {
                    console.log("Payment successful:", response);
                    setIsLoading(false);
                    saveOrder();
                    navigate("/checkout-success", { replace: true });
                },
                onClose: function () {
                    setIsLoading(false);
                    alert("Transaction was not completed, window closed.");
                },
            });
        } else {
            setIsLoading(false);
            alert("Payment initialization failed. Please try again.");
        }
    };

    return (
        <main>
            {isLoading && <Loader />}
            <div className="rounded-md shadow-xl pt-4 pb-8 px-10">
                <h1 className="text-3xl font-light mb-2">Paystack Checkout</h1>
                <form className="md:w-[30rem]" onSubmit={handlePaystackPayment}>
                    <button disabled={isLoading} className="btn bg-blue-600 paystack-button">
                        {isLoading ? "Processing..." : "Pay Now"}
                    </button>
                </form>
            </div>
        </main>
    );
};

export default CheckoutForm;
