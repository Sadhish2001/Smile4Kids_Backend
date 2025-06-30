const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('./paymentModel');
const PaidVideoModel = require('./paidVideoModel'); // <-- Add this

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  console.log("Webhook hit!");

  const sig = req.headers['stripe-signature'];
  let event;

  // try {
  //   event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  // } catch (err) {
  //   return res.status(400).send(`Webhook Error: ${err.message}`);
  // }
  // Instead, just parse the body:
  event = JSON.parse(req.body.toString());

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    console.log("Payment Intent ID:", paymentIntent.id);
    console.log("Will save to DB:", {
      stripe_session_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      course_type: paymentIntent.metadata.courseType,
      status: paymentIntent.status,
    });

    try {
      await PaymentModel.save({
        stripe_session_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        course_type: paymentIntent.metadata.courseType || null,
        status: paymentIntent.status
      });
      console.log('Saved to DB');
    } catch (saveErr) {
      console.error('Failed to save payment to DB:', saveErr);
    }

    // --- NEW: Mark user_paid_videos ---
    const user_id = paymentIntent.metadata?.user_id;
    const language = paymentIntent.metadata?.language;
    const level = paymentIntent.metadata?.level;
    console.log('user_id:', user_id);
    console.log('language:', language);
    console.log('level:', level);
    if (user_id && language && level) {
      try {
        await PaidVideoModel.markPaid(user_id, language, level);
        console.log(`Marked paid: user ${user_id}, ${language}-${level}`);
      } catch (err) {
        console.error('Failed to mark paid in user_paid_videos:', err);
      }
    } else {
      console.warn('Missing metadata for user_paid_videos:', { user_id, language, level });
    }
    // --- END NEW ---
  }

  res.status(200).json({ received: true });
});

module.exports = router;
