import React, { useState, useEffect } from "react";
import Loader from "../../components/loader/Loader";
import { useSelector, useDispatch } from "react-redux";
import { calculateSubtotal, calculateTotalQuantity } from "../../redux/slice/cartSlice";
import { formatPrice } from "../../utils/formatPrice";
import PaystackPop from "@paystack/inline-js";
import "./paystack.css";

const Checkout = () => {
    // Redux states
    const { cartItems, totalQuantity, totalAmount } = useSelector((store) => store.cart);
    const { shippingAddress, billingAddress } = useSelector((store) => store.checkout);
    const { email } = useSelector((store) => store.auth);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(calculateSubtotal());
        dispatch(calculateTotalQuantity());
    }, [dispatch, cartItems]);

    // local states
    const [loading, setLoading] = useState(false);

    const handlePaystackPayment = () => {
        setLoading(true);
        // First, make a POST request to your backend to initialize the transaction and get the access code
        fetch("https://ecom-server.onrender.com/initialize-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                items: cartItems,
                userEmail: email,
                shippingAddress,
                billingAddress,
                description: `Payment of ${formatPrice(totalAmount)} from ${email}`,
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            const { access_code } = data;

            const paystack = new PaystackPop();
            paystack.resumeTransaction(access_code);

            setLoading(false);
        })
        .catch((error) => {
            console.error("Error initializing transaction:", error);
            setLoading(false);
        });
    };

    return (
        <main>
            {loading && <Loader />}
            <div>
                <button onClick={handlePaystackPayment} className="pay-button">
                    Pay Now
                </button>
            </div>
        </main>
    );
};

export default Checkout;
