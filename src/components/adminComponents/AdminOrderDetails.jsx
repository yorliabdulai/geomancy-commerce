import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loader from "../../components/loader/Loader";
//firebase
import useFetchDocument from "../../hooks/useFetchDocument";
import OrderDetailsComponent from "../../components/orderDetailsComponent/OrderDetailsComponent";

/**
 * AdminOrderDetails
 *
 * This component fetches the order details and shows the component OrderDetailsComponent
 * which is the same component used in the user's order history, but with the admin prop set to true.
 *
 * @param {string} id - The id of the order to fetch from Firebase.
 *
 * @returns JSX.Element
 */
const AdminOrderDetails = () => {
    const [order, setOrder] = useState(null);
    const { id } = useParams();
    const { document } = useFetchDocument("orders", id);

    useEffect(() => {
        console.log("Fetched Document from Hook:", document); // Log here to see the document being set
        setOrder(document);
    }, [document]);

    return (
        <>
            {order === null ? (
                <Loader />
            ) : (
                <div>
                    <OrderDetailsComponent order={order} user={false} admin={true} orderId={id} />
                </div>
            )}
        </>
    );
};

export default AdminOrderDetails;
