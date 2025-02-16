import { buffer } from "micro";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
});

export const config = {
    api: {
        bodyParser: false, // Required to properly handle raw request body
    },
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;
    try {
        const rawBody = await buffer(req);
        event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
    } catch (err) {
        console.error("Webhook signature verification failed.", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle subscription creation
    if (event.type === "customer.subscription.created") {
        const subscription = event.data.object;
        console.log("New Subscription Created:", subscription.id);

        // TODO: Store subscription details in the database or perform further actions
    }

    res.status(200).json({ received: true });
}
