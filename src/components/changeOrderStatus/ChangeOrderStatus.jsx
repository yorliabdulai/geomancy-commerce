import React, { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
import supabase from "../../supabase/supabase";

const ChangeOrderStatus = ({ order, orderId, onUpdate }) => {
    const [status, setStatus] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const changeStatus = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        if (!orderId) {
            toast.error("Error: Order ID is missing!");
            setIsLoading(false);
            return;
        }

        if (!status) {
            toast.error("Please select a status before updating.");
            setIsLoading(false);
            return;
        }

        const orderDetails = {
            userId: order.userId,
            email: order.email,
            orderDate: order.orderDate,
            orderAmount: order.orderAmount,
            orderStatus: status,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt,
            editedAt: new Date().toISOString(), // Replaces Timestamp.now()
        };

        try {
            const { error } = await supabase
                .from("orders")
                .update(orderDetails)
                .eq("id", orderId);

            if (error) {
                throw new Error(error.message);
            }

            toast.success(`Order status changed to ${status}`);

            // Trigger rerender
            if (onUpdate) onUpdate();

            navigate("/admin/orders");
        } catch (error) {
            toast.error(`Update failed: ${error.message}`);
        } finally {
            setIsLoading(false);
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
                        <option disabled value="">--Status---</option>
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
