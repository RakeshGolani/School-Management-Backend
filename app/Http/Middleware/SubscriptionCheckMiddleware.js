const { SchoolSubscription } = require('../../Models');

/**
 * SubscriptionCheckMiddleware
 * Restricts write requests (POST, PUT, DELETE) if the school subscription has expired or is inactive.
 */
async function SubscriptionCheckMiddleware(req, res, next) {
  try {
    const schoolId = req.headers['x-school-id'] || req.query.schoolId;

    // If no school context is present, proceed
    if (!schoolId) {
      return next();
    }

    // Read active/trialing subscription for this school
    const subscription = await SchoolSubscription.findOne({
      where: {
        school_id: schoolId
      }
    });

    // Check if subscription exists and is valid
    const now = new Date();
    const isActive = subscription && 
                     (subscription.status === 'active' || subscription.status === 'trialing') && 
                     new Date(subscription.ends_at) > now;

    if (!isActive) {
      // Allow read operations (GET) so school users can view dashboards and check invoices
      if (req.method === 'GET') {
        return next();
      }

      // Restrict modification requests (POST, PUT, PATCH, DELETE)
      return res.status(402).json({
        status: 'error',
        code: 'SUBSCRIPTION_EXPIRED',
        message: 'Your school subscription has expired or is suspended. Please upgrade or renew your plan.'
      });
    }

    // Set subscription on request object for downstream controllers
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Error in SubscriptionCheckMiddleware:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error validating school subscription'
    });
  }
}

module.exports = SubscriptionCheckMiddleware;
