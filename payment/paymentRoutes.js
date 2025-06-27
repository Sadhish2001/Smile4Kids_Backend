const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Load from env
const PaymentModel = require('./paymentModel'); // Make sure this exists
const PaidVideoModel = require('./paidVideoModel'); // Add this

// ✅ Allowed payment types - ensure casing matches frontend
const PAYMENT_TYPES = [
  'Hindi-Junior',
  'Hindi-Pre_Junior',
  'Gujarati-Junior',
  'Gujarati-Pre_Junior',
  'Panjabi-Junior',
  'Panjabi-Pre_Junior',
];
// £45 in pence
const PAYMENT_AMOUNT_PENCE = 4500; // £45 in pence

router.post('/create-payment-intent', async (req, res) => {
  const { language, level, currency = 'gbp' } = req.body;

  // Validate language and level
  if (!language || !level) {
    return res.status(400).json({ message: 'language and level are required' });
  }

  // Validate payment type
  if (!PAYMENT_TYPES.includes(type?.trim())) {
    return res.status(400).json({
      message: 'Invalid payment type',
      allowedTypes: PAYMENT_TYPES,
    });
  }

  try {
    // 1. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PAYMENT_AMOUNT_PENCE,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        courseType: type,
      },
    });

    // 2. Save payment intent to DB
    await PaymentModel.save({
      stripe_session_id: paymentIntent.id,
      amount: PAYMENT_AMOUNT_PENCE,
      currency,
      course_type: `${language}-${level}`,
      status: 'pending',
    });

    // 3. Mark this language+level as paid for user
    const user_id = req.user?.users_id; // Use users_id from your users table
    if (user_id) {
      await PaidVideoModel.markPaid(user_id, language, level);
    }

    // 4. Return client secret
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: PAYMENT_AMOUNT_PENCE,
      currency,
      type,
    });

  } catch (error) {
    console.error('❌ Stripe paymentIntent error:', error);
    res.status(500).json({
      message: 'Payment failed',
      error: error.message,
    });
  }
});

module.exports = router;
