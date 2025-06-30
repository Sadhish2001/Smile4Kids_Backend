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
  const { language, level, currency = 'gbp', user_id } = req.body;

  // Validate language and level
  if (!language || !level || !user_id) {
    return res.status(400).json({ message: 'user_id, language and level are required' });
  }

  const courseType = `${language}-${level}`;
  const amount = PAYMENT_AMOUNT_PENCE;

  // Validate payment type
  if (!PAYMENT_TYPES.includes(courseType)) {
    return res.status(400).json({
      message: 'Invalid payment type',
      allowedTypes: PAYMENT_TYPES,
    });
  }

  try {
    // 1. Create Stripe Payment Intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: String(user_id),
        language,
        level,
        courseType
      },
    });

    console.log('Webhook metadata:', paymentIntent.metadata);

    // 2. Save payment intent to DB
    await PaymentModel.save({
      stripe_session_id: paymentIntent.id,
      amount,
      currency,
      course_type: courseType,
      status: 'pending',
    });

    // 3. (Optional) Mark this language+level as paid for user immediately (usually done in webhook)
    // await PaidVideoModel.markPaid(user_id, language, level);

    // 4. Return client secret
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      courseType,
      status: paymentIntent.status,
    });

  } catch (error) {
    console.error('❌ Stripe paymentIntent error:', error);
    res.status(500).json({
      message: 'Payment failed',
      error: error.message,
    });
  }
});

// Add this route to your paymentRoutes.js or another route file
router.get('/paid-videos/:user_id', async (req, res) => {
  const user_id = req.params.user_id;
  try {
    const paidVideos = await require('./paidVideoModel').getPaidVideos(user_id);
    res.json(paidVideos);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching paid videos', error: err.message });
  }
});

module.exports = router;
