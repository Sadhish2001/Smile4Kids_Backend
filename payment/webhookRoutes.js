// const express = require('express');
// const router = express.Router();
// const Stripe = require('stripe');
// const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
// const PaymentModel = require('./paymentModel');

// const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
//   console.log("Webhook hit!");

//   const sig = req.headers['stripe-signature'];
//   let event;

//   try {
//     event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
//   } catch (err) {
//     console.error("Webhook signature error:", err.message);
//     return res.status(400).send(`Webhook Error: ${err.message}`);
//   }

//   if (event.type === 'payment_intent.succeeded') {
//     const paymentIntent = event.data.object;

//     console.log("Payment Intent ID:", paymentIntent.id);
//     console.log("Will save to DB:", {
//       stripe_session_id: paymentIntent.id,
//       amount: paymentIntent.amount,
//       currency: paymentIntent.currency,
//       course_type: paymentIntent.metadata.courseType,
//       status: paymentIntent.status,
//     });

//     try {
//       await PaymentModel.save({
//         stripe_session_id: paymentIntent.id,
//         amount: paymentIntent.amount,
//         currency: paymentIntent.currency,
//         course_type: paymentIntent.metadata.courseType || null,
//         status: paymentIntent.status
//       });
//       console.log('Saved to DB');
//     } catch (saveErr) {
//       console.error('Failed to save payment to DB:', saveErr);
//     }
//   }

//   res.status(200).json({ received: true });
// });

// module.exports = router;   

// sadhish
