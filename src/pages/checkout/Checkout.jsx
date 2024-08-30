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
    const [isLoading, setIsLoading] = useState(false);

    // Define the initializeTransaction function
    const initializeTransaction = async () => {
        try {
            const response = await fetch("http://localhost:3000/initialize-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: cartItems,
                    userEmail: email,
                    shippingAddress,
                    billingAddress,
                    description: `Payment of ${formatPrice(totalAmount)} from ${email}`,
                }),
            });

            const data = await response.json();
			return data.authorization_url; // Assuming your backend returns an access_code
        } catch (error) {
            console.error("Error initializing transaction:", error);
            setIsLoading(false);
            throw error;
        }
    };

    const handlePaystackPayment = async () => {
        setIsLoading(true);
        try {
			const authorizationUrl = await initializeTransaction();

			if (authorizationUrl) {
				// Redirect the user to Paystack's payment page
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
            <div>
                <button onClick={handlePaystackPayment} className="pay-button">
                    Pay Now
                </button>
            </div>
        </main>
    );
};

export default Checkout;
