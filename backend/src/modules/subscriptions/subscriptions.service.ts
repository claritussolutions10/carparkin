import pool from "../../config/database";

export async function getPlans() {
  const result = await pool.query(
    "SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price ASC"
  );
  return result.rows;
}

export async function getActiveSubscription(ownerId: string) {
  const result = await pool.query(
    `SELECT
       us.id, us.status, us.start_date, us.end_date, us.is_auto_renew,
       us.razorpay_subscription_id,
       sp.name AS plan_name, sp.price, sp.currency,
       sp.max_listings, sp.features, sp.billing_cycle,
       (us.end_date::DATE - CURRENT_DATE) AS days_remaining
     FROM user_subscriptions us
     JOIN subscription_plans sp ON us.plan_id = sp.id
     WHERE us.owner_id = $1 AND us.status = 'active'
     ORDER BY us.start_date DESC
     LIMIT 1`,
    [ownerId]
  );
  return result.rows[0] || null;
}

export async function activateSubscription(
  ownerId: string,
  planId: number,
  razorpaySubscriptionId?: string
) {
  const planResult = await pool.query(
    "SELECT billing_cycle FROM subscription_plans WHERE id = $1 AND is_active = true",
    [planId]
  );
  if (!planResult.rows[0]) {
    throw Object.assign(new Error("Plan not found"), { status: 404 });
  }

  const billingCycle = planResult.rows[0].billing_cycle;
  const endDate = billingCycle === 'yearly'
    ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
    : new Date(new Date().setMonth(new Date().getMonth() + 1));

  await pool.query(
    "UPDATE user_subscriptions SET status = 'inactive' WHERE owner_id = $1 AND status = 'active'",
    [ownerId]
  );

  await pool.query(
    `INSERT INTO user_subscriptions
       (owner_id, plan_id, status, end_date, razorpay_subscription_id, is_auto_renew)
     VALUES ($1, $2, 'active', $3, $4, true)`,
    [ownerId, planId, endDate, razorpaySubscriptionId || null]
  );

  return getActiveSubscription(ownerId);
}

export async function cancelSubscription(ownerId: string) {
  const result = await pool.query(
    `UPDATE user_subscriptions
     SET status = 'inactive'
     WHERE owner_id = $1 AND status = 'active'
     RETURNING *`,
    [ownerId]
  );
  if (!result.rows[0]) {
    throw Object.assign(new Error("No active subscription to cancel"), { status: 404 });
  }
  return result.rows[0];
}

export async function getSubscriptionHistory(ownerId: string, limit: number = 10) {
  const result = await pool.query(
    `SELECT
       us.id, us.status, us.start_date, us.end_date, us.is_auto_renew, us.created_at,
       sp.name AS plan_name, sp.price, sp.currency
     FROM user_subscriptions us
     JOIN subscription_plans sp ON us.plan_id = sp.id
     WHERE us.owner_id = $1
     ORDER BY us.start_date DESC
     LIMIT $2`,
    [ownerId, limit]
  );
  return result.rows;
}
