export declare const bookings_status_enum: {
    readonly pending_payment: "pending_payment";
    readonly confirmed: "confirmed";
    readonly picked_up: "picked_up";
    readonly processing: "processing";
    readonly ready_for_delivery: "ready_for_delivery";
    readonly delivering: "delivering";
    readonly completed: "completed";
    readonly cancelled: "cancelled";
    readonly no_show: "no_show";
};
export type bookings_status_enum = (typeof bookings_status_enum)[keyof typeof bookings_status_enum];
export declare const complaints_status_enum: {
    readonly open: "open";
    readonly investigating: "investigating";
    readonly resolved: "resolved";
    readonly rejected: "rejected";
};
export type complaints_status_enum = (typeof complaints_status_enum)[keyof typeof complaints_status_enum];
export declare const complaints_type_enum: {
    readonly lost_item: "lost_item";
    readonly damaged_item: "damaged_item";
    readonly wrong_item: "wrong_item";
    readonly late_delivery: "late_delivery";
    readonly other: "other";
};
export type complaints_type_enum = (typeof complaints_type_enum)[keyof typeof complaints_type_enum];
export declare const customer_profiles_detergent_preference_enum: {
    readonly regular: "regular";
    readonly fragrance_free: "fragrance_free";
    readonly sensitive_skin: "sensitive_skin";
};
export type customer_profiles_detergent_preference_enum = (typeof customer_profiles_detergent_preference_enum)[keyof typeof customer_profiles_detergent_preference_enum];
export declare const customer_profiles_fold_preference_enum: {
    readonly fold: "fold";
    readonly hang: "hang";
    readonly no_preference: "no_preference";
};
export type customer_profiles_fold_preference_enum = (typeof customer_profiles_fold_preference_enum)[keyof typeof customer_profiles_fold_preference_enum];
export declare const customer_profiles_gender_enum: {
    readonly male: "male";
    readonly female: "female";
    readonly other: "other";
};
export type customer_profiles_gender_enum = (typeof customer_profiles_gender_enum)[keyof typeof customer_profiles_gender_enum];
export declare const customer_profiles_membership_tier_enum: {
    readonly bronze: "bronze";
    readonly silver: "silver";
    readonly gold: "gold";
};
export type customer_profiles_membership_tier_enum = (typeof customer_profiles_membership_tier_enum)[keyof typeof customer_profiles_membership_tier_enum];
export declare const customer_profiles_notification_channel_preference_enum: {
    readonly email: "email";
    readonly push: "push";
    readonly in_app: "in_app";
    readonly sms: "sms";
};
export type customer_profiles_notification_channel_preference_enum = (typeof customer_profiles_notification_channel_preference_enum)[keyof typeof customer_profiles_notification_channel_preference_enum];
export declare const customer_profiles_water_temperature_preference_enum: {
    readonly cold: "cold";
    readonly warm: "warm";
    readonly hot: "hot";
};
export type customer_profiles_water_temperature_preference_enum = (typeof customer_profiles_water_temperature_preference_enum)[keyof typeof customer_profiles_water_temperature_preference_enum];
export declare const delivery_trips_status_enum: {
    readonly unassigned: "unassigned";
    readonly assigned: "assigned";
    readonly in_progress: "in_progress";
    readonly completed: "completed";
    readonly failed: "failed";
    readonly cancelled: "cancelled";
};
export type delivery_trips_status_enum = (typeof delivery_trips_status_enum)[keyof typeof delivery_trips_status_enum];
export declare const delivery_trips_trip_type_enum: {
    readonly pickup: "pickup";
    readonly delivery: "delivery";
};
export type delivery_trips_trip_type_enum = (typeof delivery_trips_trip_type_enum)[keyof typeof delivery_trips_trip_type_enum];
export declare const laundry_stores_status_enum: {
    readonly active: "active";
    readonly inactive: "inactive";
};
export type laundry_stores_status_enum = (typeof laundry_stores_status_enum)[keyof typeof laundry_stores_status_enum];
export declare const machines_status_enum: {
    readonly idle: "idle";
    readonly running: "running";
    readonly maintenance: "maintenance";
    readonly offline: "offline";
};
export type machines_status_enum = (typeof machines_status_enum)[keyof typeof machines_status_enum];
export declare const machines_type_enum: {
    readonly washer: "washer";
    readonly dryer: "dryer";
    readonly washer_dryer: "washer_dryer";
};
export type machines_type_enum = (typeof machines_type_enum)[keyof typeof machines_type_enum];
export declare const notifications_channel_enum: {
    readonly email: "email";
    readonly push: "push";
    readonly in_app: "in_app";
    readonly sms: "sms";
};
export type notifications_channel_enum = (typeof notifications_channel_enum)[keyof typeof notifications_channel_enum];
export declare const notifications_type_enum: {
    readonly booking_confirmed: "booking_confirmed";
    readonly booking_cancelled: "booking_cancelled";
    readonly pickup_reminder: "pickup_reminder";
    readonly pickup_completed: "pickup_completed";
    readonly processing_started: "processing_started";
    readonly ready_for_delivery: "ready_for_delivery";
    readonly delivering: "delivering";
    readonly delivery_completed: "delivery_completed";
    readonly payment_success: "payment_success";
    readonly payment_failed: "payment_failed";
    readonly complaint_update: "complaint_update";
    readonly waitlist_available: "waitlist_available";
};
export type notifications_type_enum = (typeof notifications_type_enum)[keyof typeof notifications_type_enum];
export declare const payments_method_enum: {
    readonly vnpay: "vnpay";
    readonly momo: "momo";
    readonly stripe: "stripe";
    readonly cash: "cash";
};
export type payments_method_enum = (typeof payments_method_enum)[keyof typeof payments_method_enum];
export declare const payments_payment_type_enum: {
    readonly deposit: "deposit";
    readonly balance: "balance";
    readonly full: "full";
};
export type payments_payment_type_enum = (typeof payments_payment_type_enum)[keyof typeof payments_payment_type_enum];
export declare const payments_status_enum: {
    readonly pending: "pending";
    readonly success: "success";
    readonly failed: "failed";
    readonly refunded: "refunded";
};
export type payments_status_enum = (typeof payments_status_enum)[keyof typeof payments_status_enum];
export declare const promotions_discount_type_enum: {
    readonly percent: "percent";
    readonly fixed: "fixed";
};
export type promotions_discount_type_enum = (typeof promotions_discount_type_enum)[keyof typeof promotions_discount_type_enum];
export declare const promotions_status_enum: {
    readonly active: "active";
    readonly expired: "expired";
    readonly disabled: "disabled";
};
export type promotions_status_enum = (typeof promotions_status_enum)[keyof typeof promotions_status_enum];
export declare const services_pricing_unit_enum: {
    readonly per_kg: "per_kg";
    readonly per_item: "per_item";
};
export type services_pricing_unit_enum = (typeof services_pricing_unit_enum)[keyof typeof services_pricing_unit_enum];
export declare const services_status_enum: {
    readonly active: "active";
    readonly inactive: "inactive";
};
export type services_status_enum = (typeof services_status_enum)[keyof typeof services_status_enum];
export declare const users_role_enum: {
    readonly admin: "admin";
    readonly laundry_staff: "laundry_staff";
    readonly shipper: "shipper";
    readonly customer: "customer";
};
export type users_role_enum = (typeof users_role_enum)[keyof typeof users_role_enum];
export declare const users_status_enum: {
    readonly active: "active";
    readonly inactive: "inactive";
    readonly banned: "banned";
};
export type users_status_enum = (typeof users_status_enum)[keyof typeof users_status_enum];
export declare const waitlist_status_enum: {
    readonly waiting: "waiting";
    readonly notified: "notified";
    readonly converted: "converted";
    readonly expired: "expired";
};
export type waitlist_status_enum = (typeof waitlist_status_enum)[keyof typeof waitlist_status_enum];
