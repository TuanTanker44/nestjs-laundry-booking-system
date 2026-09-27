export const bookings_status_enum = {
    pending_payment: 'pending_payment',
    confirmed: 'confirmed',
    picked_up: 'picked_up',
    processing: 'processing',
    ready_for_delivery: 'ready_for_delivery',
    delivering: 'delivering',
    completed: 'completed',
    cancelled: 'cancelled',
    no_show: 'no_show'
};
export const complaints_status_enum = {
    open: 'open',
    investigating: 'investigating',
    resolved: 'resolved',
    rejected: 'rejected'
};
export const complaints_type_enum = {
    lost_item: 'lost_item',
    damaged_item: 'damaged_item',
    wrong_item: 'wrong_item',
    late_delivery: 'late_delivery',
    other: 'other'
};
export const customer_profiles_detergent_preference_enum = {
    regular: 'regular',
    fragrance_free: 'fragrance_free',
    sensitive_skin: 'sensitive_skin'
};
export const customer_profiles_fold_preference_enum = {
    fold: 'fold',
    hang: 'hang',
    no_preference: 'no_preference'
};
export const customer_profiles_gender_enum = {
    male: 'male',
    female: 'female',
    other: 'other'
};
export const customer_profiles_membership_tier_enum = {
    bronze: 'bronze',
    silver: 'silver',
    gold: 'gold'
};
export const customer_profiles_notification_channel_preference_enum = {
    email: 'email',
    push: 'push',
    in_app: 'in_app',
    sms: 'sms'
};
export const customer_profiles_water_temperature_preference_enum = {
    cold: 'cold',
    warm: 'warm',
    hot: 'hot'
};
export const delivery_trips_status_enum = {
    unassigned: 'unassigned',
    assigned: 'assigned',
    in_progress: 'in_progress',
    completed: 'completed',
    failed: 'failed',
    cancelled: 'cancelled'
};
export const delivery_trips_trip_type_enum = {
    pickup: 'pickup',
    delivery: 'delivery'
};
export const laundry_stores_status_enum = {
    active: 'active',
    inactive: 'inactive'
};
export const machines_status_enum = {
    idle: 'idle',
    running: 'running',
    maintenance: 'maintenance',
    offline: 'offline'
};
export const machines_type_enum = {
    washer: 'washer',
    dryer: 'dryer',
    washer_dryer: 'washer_dryer'
};
export const notifications_channel_enum = {
    email: 'email',
    push: 'push',
    in_app: 'in_app',
    sms: 'sms'
};
export const notifications_type_enum = {
    booking_confirmed: 'booking_confirmed',
    booking_cancelled: 'booking_cancelled',
    pickup_reminder: 'pickup_reminder',
    pickup_completed: 'pickup_completed',
    processing_started: 'processing_started',
    ready_for_delivery: 'ready_for_delivery',
    delivering: 'delivering',
    delivery_completed: 'delivery_completed',
    payment_success: 'payment_success',
    payment_failed: 'payment_failed',
    complaint_update: 'complaint_update',
    waitlist_available: 'waitlist_available'
};
export const payments_method_enum = {
    vnpay: 'vnpay',
    momo: 'momo',
    stripe: 'stripe',
    cash: 'cash'
};
export const payments_payment_type_enum = {
    deposit: 'deposit',
    balance: 'balance',
    full: 'full'
};
export const payments_status_enum = {
    pending: 'pending',
    success: 'success',
    failed: 'failed',
    refunded: 'refunded'
};
export const promotions_discount_type_enum = {
    percent: 'percent',
    fixed: 'fixed'
};
export const promotions_status_enum = {
    active: 'active',
    expired: 'expired',
    disabled: 'disabled'
};
export const services_pricing_unit_enum = {
    per_kg: 'per_kg',
    per_item: 'per_item'
};
export const services_status_enum = {
    active: 'active',
    inactive: 'inactive'
};
export const users_role_enum = {
    admin: 'admin',
    laundry_staff: 'laundry_staff',
    shipper: 'shipper',
    customer: 'customer'
};
export const users_status_enum = {
    active: 'active',
    inactive: 'inactive',
    banned: 'banned'
};
export const waitlist_status_enum = {
    waiting: 'waiting',
    notified: 'notified',
    converted: 'converted',
    expired: 'expired'
};
//# sourceMappingURL=enums.js.map