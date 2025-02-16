import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe("SECRET_KEY_HERE");

export async function POST(req) {
    try {
        const { item, email } = await req.json();

        // Create a customer if needed (optional, but recommended)
        const customer = await stripe.customers.create({
            email,
        });

        // Create a subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: 'price_1Qsou7AUptdwqf8dI6QAiWBT'}, {price: 'price_1QspHDAUptdwqf8dRpoYA3zu', quantity: 10}],
            payment_behavior: "default_incomplete",
            expand: ["latest_invoice.payment_intent"],
        });

        return NextResponse.json({
            clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        });
    } catch (error) {
        console.error("Stripe error:", error);
        return NextResponse.json(
            { error: error.message },
            { status: 400 }
        );
    }
}
