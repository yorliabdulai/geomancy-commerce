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

	const changeStatus = async (e, orderId) => {
		e.preventDefault();
		setIsloading(true);
		console.log("Order ID:", orderId);
		console.log("Order details:", order);
		
		// Ensure that all necessary fields are defined
		if (!order.userId || !order.email || !order.orderAmount) {
		  toast.error("Missing order information. Cannot update status.");
		  setIsloading(false);
		  return;
		}
	  
		const orderDetails = {
		  userId: order.userId,
		  email: order.email,
		  orderDate: order.orderDate || "N/A", // Provide fallback values if necessary
		  orderTime: order.orderTime || "N/A",
		  orderAmount: order.orderAmount || 0,
		  orderStatus: status || "Order Placed", // Default to "Order Placed" if no status selected
		  cartItems: order.cartItems || [],
		  shippingAddress: order.shippingAddress || {},
		  createdAt: order.createdAt || Timestamp.now(),
		  editedAt: Timestamp.now(), // No need to call .toDate(), Firestore handles timestamps natively
		};
	  
		try {
		  // Ensure orderId is valid before calling setDoc
		  if (!orderId) {
			throw new Error("Invalid order ID");
		  }
	  
		  // Update the order status in Firestore
		  await setDoc(doc(db, "orders", orderId), orderDetails);
		  
		  setIsloading(false);
		  toast.success(`Order status changed to ${status}`);
		  navigate("/admin/orders");
		} catch (error) {
		  setIsloading(false);
		  toast.error(`Failed to update status: ${error.message}`);
		  console.log("Error updating order status:", error);
		}
	  };
	  

	return (
		<>
			{isLoading && <Loader />}
			<div className="w-full md:w-96  p-2 rounded-sm shadow-lg">
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
