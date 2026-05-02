const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { schedule } = require('../data/schedule');

// Get full schedule for logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const { completedDays, startDate } = req.user;
    res.json({ schedule, completedDays, startDate });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single day details
router.get('/:day', auth, async (req, res) => {
  const dayNum = parseInt(req.params.day);
  const dayData = schedule.find(d => d.day === dayNum);
  if (!dayData) return res.status(404).json({ message: 'Day not found' });
  res.json({ day: dayData, completed: req.user.completedDays.includes(dayNum) });
});

// Mark day as done / undo
router.post('/:day/toggle', auth, async (req, res) => {
  try {
    const dayNum = parseInt(req.params.day);
    const user = req.user;
    const idx = user.completedDays.indexOf(dayNum);
    if (idx === -1) {
      user.completedDays.push(dayNum);
    } else {
      user.completedDays.splice(idx, 1);
    }
    await user.save();
    res.json({ completedDays: user.completedDays });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
