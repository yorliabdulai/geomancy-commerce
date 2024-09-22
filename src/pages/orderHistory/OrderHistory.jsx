import React, { useEffect } from "react";
import { Header, OrdersComponent } from "../../components";
import useFetchCollection from "../../hooks/useFetchCollection";
import Loader from "../../components/loader/Loader";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { storeOrders } from "../../redux/slice/orderSlice";
import { formatPrice } from "../../utils/formatPrice";

const OrderHistory = () => {
    const { data, isLoading } = useFetchCollection("orders");
    const { orderHistory } = useSelector((store) => store.order);
    const { email } = useSelector((store) => store.auth); // Change this from userId to email
    const dispatch = useDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(storeOrders(data));
    }, [dispatch, data]);

    function handleClick(orderId) {
        navigate(`/order-details/${orderId}`);
    }

    // Filter orders based on email instead of userId
    const filteredOrders = orderHistory.filter((order) => order.email === email);

    console.log("Raw data from Firestore:", data);
    console.log("User email:", email);
    console.log("Order history from Redux:", orderHistory);
    console.log("Filtered orders:", filteredOrders);

    return (
        <>
            {isLoading && <Loader />}
            <Header text="My Orders" />
            <main className="w-full mx-auto px-2 lg:w-9/12 md:px-6 mt-6 ">
                <OrdersComponent orders={filteredOrders} user={true} admin={false} />
            </main>
        </>
    );
};

export default OrderHistory;