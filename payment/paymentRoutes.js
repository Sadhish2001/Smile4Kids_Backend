const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const PaymentModel = require('./paymentModel'); // adjust the path if needed



const PAYMENT_TYPES = [
  'Hindi-Junior', 'Hindi-Pre_Junior',
  'Gujarati-Junior', 'Gujarati-Pre_Junior',
  'Panjabi-Junior', 'Panjabi-Pre_Junior'
];
const PAYMENT_AMOUNT_PENCE = 4500; // £85 in pence   

router.post('/create-payment-intent', async (req, res) => {
  const { type, currency = 'gbp' } = req.body;

  if (!PAYMENT_TYPES.includes(type)) {
    return res.status(400).json({ message: 'Invalid payment type', allowedTypes: PAYMENT_TYPES });
  }

  try {
    // 1. Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PAYMENT_AMOUNT_PENCE,
      currency: currency,
      automatic_payment_methods: { enabled: true },
      metadata: { courseType: type },
    });

    // 2. Save payment info to database with status "pending"
    await PaymentModel.save({
      stripe_session_id: paymentIntent.id,
      amount: PAYMENT_AMOUNT_PENCE,
      currency: currency,
      course_type: type,
      status: 'pending'
    });

    // 3. Respond to client with payment secret and data
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: PAYMENT_AMOUNT_PENCE,
      currency,
      type
    });

  } catch (error) {
    console.error('Stripe paymentIntent error:', error);
    res.status(500).json({ message: 'Payment failed', error: error.message });
  }
});

module.exports = router;
