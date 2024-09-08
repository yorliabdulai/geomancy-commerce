import React, { useState } from "react";
import { toast } from "react-toastify";
import Loader from "../loader/Loader";
import { useNavigate } from "react-router-dom";
// firebase
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "../../firebase/config";

const ChangeOrderStatus = ({ order, orderId }) => {
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const changeStatus = (e, orderId) => {
    e.preventDefault();
    setIsLoading(true);

    // Fallback values added for missing properties
    const orderDetails = {
      userId: order?.userId || "Unknown User",
      email: order?.email || "No Email",
      orderDate: order?.orderDate || new Date(),
      orderTime: order?.orderTime || new Date(),
      orderAmount: order?.orderAmount || 0,
      orderStatus: status,
      cartItems: order?.cartItems || [],
      shippingAddress: order?.shippingAddress || {},
      createdAt: order?.createdAt || Timestamp.now(),
      editedAt: Timestamp.now().toDate(),
    };

    try {
      setDoc(doc(db, "orders", orderId), orderDetails);
      setIsLoading(false);
      toast.success(`Order status changed to ${status}`);
      navigate("/admin/orders");
    } catch (error) {
      toast.error(error.message);
      console.log(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="w-full md:w-96 p-2 rounded-sm shadow-lg">
        <h1 className="text-2xl">Update Order Status</h1>
        <form onSubmit={(e) => changeStatus(e, orderId)} className="form-control">
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
