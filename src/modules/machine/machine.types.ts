import type { machines_status_enum } from '../../generated/prisma/client.js';

/** Trạng thái staff được đặt tay; `running` chỉ đến từ việc gán máy cho đơn. */
export const MANUAL_MACHINE_STATUSES = ['idle', 'maintenance', 'offline'] as const;

export type ManualMachineStatus = Extract<
  machines_status_enum,
  (typeof MANUAL_MACHINE_STATUSES)[number]
>;
