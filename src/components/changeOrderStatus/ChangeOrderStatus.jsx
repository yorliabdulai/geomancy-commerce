import React, { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
// firebase
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/config";

const ChangeOrderStatus = ({ order, orderId }) => {
    const [status, setStatus] = useState("");
    const [isLoading, setIsloading] = useState(false);
    const navigate = useNavigate();

    const changeStatus = async (e) => {
        e.preventDefault();
        setIsloading(true);

        // Log order to check for fields
        

        const orderDetails = {
            ...(order.userId && { userId: order.userId }), // Include userId only if it exists
            email: order.email,
            orderDate: order.orderDate,
            ...(order.orderTime && { orderTime: order.orderTime }), // Include orderTime only if it exists
            orderAmount: order.orderAmount,
            orderStatus: status,
            ...(order.cartItems && { cartItems: order.cartItems }), // Include cartItems only if it exists
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt,
            editedAt: Timestamp.now().toDate(),
        };

        try {
            await setDoc(doc(db, "orders", orderId), orderDetails);
            toast.success(`Order status changed to ${status}`);
            navigate("/admin/orders");
        } catch (error) {
            toast.error(error.message);
            
        } finally {
            setIsloading(false);
        }
    };

    return (
        <>
            {isLoading && <Loader />}
            <div className="w-full md:w-96 p-2 rounded-sm shadow-lg">
                <h1 className="text-2xl">Update Order Status</h1>
                <form onSubmit={changeStatus} className="form-control">
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="select select-secondary w-full max-w-xs"
                    >
                        <option disabled>--Status---</option>
                        <option value="orderPlaced">Order Placed</option>
                        <option value="Processing...">Processing...</option>
                        <option value="Item(s) Shipped">Item(s) Shipped</option>
                        <option value="Item(s) Delivered">Item(s) Delivered</option>
                    </select>
                    <button type="submit" className="btn btn-primary-content btn-sm mt-2">
                        Update status
                    </button>
                </form>
            </div>
        </>
    );
};

export default ChangeOrderStatus;
