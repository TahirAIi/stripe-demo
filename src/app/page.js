"use client";
import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("PUBLIC_KEY_HERE");

const SubscribeForm = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        if (!stripe || !elements) {
            return;
        }

        try {
            const response = await fetch("/api/create-subscription-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (!data.clientSecret) {
                throw new Error("Failed to get client secret");
            }

            const clientSecret = data.clientSecret;
            const cardNumberElement = elements.getElement(CardNumberElement);
            const cardExpiryElement = elements.getElement(CardExpiryElement);
            const cardCvcElement = elements.getElement(CardCvcElement);

            if (!cardNumberElement || !cardExpiryElement || !cardCvcElement) {
                setError("Card information is required.");
                setLoading(false);
                return;
            }

            const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardNumberElement,
                    billing_details: {
                        name: name || "N/A",
                        email: email || "N/A"
                    }
                },
            });

            if (error) {
                setError(error.message);
                setLoading(false);
                return;
            }

            if (paymentIntent.status === "requires_action") {
                const { error: actionError, paymentIntent: authenticatedIntent } = await stripe.confirmCardPayment(clientSecret);

                if (actionError) {
                    setError(actionError.message);
                    setLoading(false);
                    return;
                }

                if (authenticatedIntent.status === "succeeded") {
                    alert("Subscription successful!");
                }
            } else if (paymentIntent.status === "succeeded") {
                alert("Subscription successful!");
            }
        } catch (err) {
            console.error("Payment Error:", err);
            setError(err.message || "An unknown error occurred.");
        }

        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            <label>Card Number</label>
            <CardNumberElement options={{ style: { base: { fontSize: "16px" } } }} />
            <label>Expiry Date</label>
            <CardExpiryElement options={{ style: { base: { fontSize: "16px" } } }} />
            <label>CVV</label>
            <CardCvcElement options={{ style: { base: { fontSize: "16px" } } }} />
            <button type="submit" disabled={!stripe || loading}>
                {loading ? "Processing..." : "Subscribe"}
            </button>
            {error && <div style={{ color: "red" }}>{error}</div>}
        </form>
    );
};

const StripeSubscription = () => {
    return (
        <Elements stripe={stripePromise}>
            <SubscribeForm />
        </Elements>
    );
};

export default StripeSubscription;
