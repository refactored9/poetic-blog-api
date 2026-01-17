const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');

// Helper to detect device type from user agent
function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

// Helper to detect browser from user agent
function getBrowser(userAgent) {
  if (!userAgent) return 'unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Other';
}

// POST /api/analytics/visit - Record a page visit
router.post('/visit', async (req, res) => {
  try {
    const { page, source, medium, campaign, timestamp } = req.body;

    // Get IP address
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.socket?.remoteAddress ||
               'unknown';

    const userAgent = req.headers['user-agent'] || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';

    const visit = new Visit({
      page,
      source: source || 'direct',
      medium,
      campaign,
      ip,
      userAgent,
      referrer,
      device: getDeviceType(userAgent),
      browser: getBrowser(userAgent),
      createdAt: timestamp ? new Date(timestamp) : new Date(),
    });

    await visit.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.json({ success: false });
  }
});

// GET /api/analytics/visitors - Get visitor stats
router.get('/visitors', async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get total visits
    const totalVisitors = await Visit.countDocuments();

    // Get today's visits
    const todayVisitors = await Visit.countDocuments({
      createdAt: { $gte: todayStart }
    });

    // Get unique visitors (by IP)
    const uniqueVisitors = await Visit.distinct('ip').then(ips => ips.length);

    res.json({
      totalVisitors,
      todayVisitors,
      uniqueVisitors,
    });
  } catch (error) {
    console.error('Error getting visitor stats:', error);
    res.json({
      totalVisitors: 0,
      todayVisitors: 0,
      uniqueVisitors: 0,
    });
  }
});

// GET /api/analytics/sources - Get traffic sources breakdown
router.get('/sources', async (req, res) => {
  try {
    const sources = await Visit.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(sources.map(s => ({ source: s._id, count: s.count })));
  } catch (error) {
    console.error('Error getting sources:', error);
    res.json([]);
  }
});

// GET /api/analytics/pages - Get top pages
router.get('/pages', async (req, res) => {
  try {
    const pages = await Visit.aggregate([
      {
        $group: {
          _id: '$page',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(pages.map(p => ({ page: p._id, count: p.count })));
  } catch (error) {
    console.error('Error getting pages:', error);
    res.json([]);
  }
});

// GET /api/analytics/devices - Get device breakdown
router.get('/devices', async (req, res) => {
  try {
    const devices = await Visit.aggregate([
      {
        $group: {
          _id: '$device',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json(devices.map(d => ({ device: d._id, count: d.count })));
  } catch (error) {
    console.error('Error getting devices:', error);
    res.json([]);
  }
});

// GET /api/analytics/recent - Get recent visits
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const visits = await Visit.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('page source device browser createdAt');

    res.json(visits);
  } catch (error) {
    console.error('Error getting recent visits:', error);
    res.json([]);
  }
});

module.exports = router;
