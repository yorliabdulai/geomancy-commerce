import React, { useEffect, useState } from "react";
//Firebase
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const useFetchDocument = (collectionName, documentId) => {
    const [document, setDocument] = useState(null);

    const getDocument = async () => {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const obj = {
                id: documentId,
                ...docSnap.data(),
            };
            setDocument(obj);
            console.log("Fetched Document:", obj); // Log the fetched document
        } else {
            console.log("No such document exists!");
        }
    };

    // Fetching single document from firestore on initial component mount or when documentId changes
    useEffect(() => {
        getDocument();
    }, [documentId]); // Added documentId as a dependency

    return { document };
};

export default useFetchDocument;
