ALTER TABLE bookings
      ALTER COLUMN scheduled_pickup_start DROP NOT NULL,
      ALTER COLUMN scheduled_pickup_end DROP NOT NULL;