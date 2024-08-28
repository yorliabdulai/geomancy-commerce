import React, { useState, useEffect } from "react";
import Loader from "../../components/loader/Loader";
import { useSelector, useDispatch } from "react-redux";
import { calculateSubtotal, calculateTotalQuantity } from "../../redux/slice/cartSlice";
import { formatPrice } from "../../utils/formatPrice";
import PaystackPop from '@paystack/inline-js';

const CheckoutForm = () => {
    // Redux states
    const { cartItems, totalQuantity, totalAmount } = useSelector((store) => store.cart);
    const { shippingAddress, billingAddress } = useSelector((store) => store.checkout);
    const { email } = useSelector((store) => store.auth);
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(false); // State to manage loading
    const [accessCode, setAccessCode] = useState(""); // State to store Paystack access code

    useEffect(() => {
        dispatch(calculateSubtotal());
        dispatch(calculateTotalQuantity());
    }, [dispatch, cartItems]);

    const description = `Payment of ${formatPrice(totalAmount)} from ${email}`;

    // Function to initialize transaction and get access code
    const initializeTransaction = async () => {
        try {
            const response = await fetch("http://localhost:3000/initialize-transaction", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: email,
                    amount: totalAmount * 100, // Convert amount to kobo
                    description: description,
                    shippingAddress: shippingAddress,
                    billingAddress: billingAddress
                }),
            });
            const data = await response.json();
            setAccessCode(data.accessCode);
        } catch (error) {
            console.error("Error initializing transaction:", error);
        }
    };

    const handlePaystackPayment = async () => {
        setIsLoading(true);
        await initializeTransaction();

        if (accessCode) {
            const paystack = new PaystackPop();
            paystack.popup({
                key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
                email: email,
                amount: totalAmount * 100, // Convert to kobo
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
                    // Handle successful payment here
                },
                onClose: function () {
                    setIsLoading(false);
                    alert("Transaction was not completed, window closed.");
                },
            });
        }
    };

    return (
        <main>
            {isLoading && <Loader />}
            <div className="rounded-md shadow-xl pt-4 pb-8 px-10">
            <h1 className="text-3xl font-light mb-2">Paystack Checkout</h1>
            <form className="md:w-[30rem]" >
              
                {!isLoading && (
                    <button onClick={handlePaystackPayment} className="btn bg-blue-600 paystack-button">
                        Pay Now
                    </button>
                )}
            </form>
            </div>
        </main>
    );
};

export default CheckoutForm;
