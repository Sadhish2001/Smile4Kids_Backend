const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Load from env
const PaymentModel = require('./paymentModel'); // Make sure this exists
const PaidVideoModel = require('./paidVideoModel'); // Add this
const authMiddleware = require('../authMiddleware');


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
const PAYMENT_AMOUNT_PENCE = 45; // £45 in pence

router.post('/create-payment-intent', async (req, res) => {
  const { selections, currency = 'gbp', user_id } = req.body;
  // selections: [{ language: 'Gujarati', level: 'Junior' }, ...]

  if (!Array.isArray(selections) || selections.length === 0 || !user_id) {
    return res.status(400).json({ message: 'user_id and selections (array) are required' });
  }

  // Validate all selections
  for (const sel of selections) {
    const courseType = `${sel.language}-${sel.level}`;
    if (!PAYMENT_TYPES.includes(courseType)) {
      return res.status(400).json({
        message: `Invalid payment type: ${courseType}`,
        allowedTypes: PAYMENT_TYPES,
      });
    }
  }

  const amount = selections.length * PAYMENT_AMOUNT_PENCE;

  try {
    // Store selections as JSON in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        user_id: String(user_id),
        selections: JSON.stringify(selections)
      },
    });

    await PaymentModel.save({
      stripe_session_id: paymentIntent.id,
      amount,
      currency,
      course_type: selections.map(sel => `${sel.language}-${sel.level}`).join(','),
      status: 'pending',
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount,
      currency,
      selections,
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

// Calculate total payment amount for selected courses
router.post('/calculate-amount', (req, res) => {
  const { selections } = req.body;
  // selections: [{ language: 'Gujarati', level: 'Junior' }, ...]

  if (!Array.isArray(selections) || selections.length === 0) {
    return res.status(400).json({ message: 'selections (array) are required' });
  }

  // Validate all selections
  for (const sel of selections) {
    const courseType = `${sel.language}-${sel.level}`;
    if (!PAYMENT_TYPES.includes(courseType)) {
      return res.status(400).json({
        message: `Invalid payment type: ${courseType}`,
        allowedTypes: PAYMENT_TYPES,
      });
    }
  }

  const amount = selections.length * PAYMENT_AMOUNT_PENCE;
  res.json({ amount, count: selections.length, currency: 'gbp' });
});

// Get all paid video categories for the authenticated user
router.get('/my-paid-videos', authMiddleware, async (req, res) => {
  try {
    const user_id = req.user.users_id; // user info from JWT
    const paidVideos = await PaidVideoModel.getPaidVideos(user_id);
    res.json(paidVideos);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching paid videos', error: err.message });
  }
});

module.exports = router;
