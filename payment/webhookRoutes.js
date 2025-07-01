const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('./paymentModel');
const PaidVideoModel = require('./paidVideoModel'); 
const authMiddleware = require('../authMiddleware');


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
    const user_id = paymentIntent.metadata?.user_id;
    let selections = [];
    try {
      selections = JSON.parse(paymentIntent.metadata?.selections || '[]');
    } catch (e) {
      selections = [];
    }

    if (user_id && Array.isArray(selections)) {
      for (const sel of selections) {
        if (sel.language && sel.level) {
          try {
            await PaidVideoModel.markPaid(user_id, sel.language, sel.level);
            console.log(`Marked paid: user ${user_id}, ${sel.language}-${sel.level}`);
          } catch (err) {
            console.error('Failed to mark paid in user_paid_videos:', err);
          }
        }
      }
    } else {
      console.warn('Missing metadata for user_paid_videos:', { user_id, selections });
    }

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
  }

  res.status(200).json({ received: true });
});

module.exports = router;
