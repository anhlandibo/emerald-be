export enum BookingStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export const BookingStatusLabels = {
  [BookingStatus.PENDING]: 'Chờ thanh toán',
  [BookingStatus.PAID]: 'Đã thanh toán',
  [BookingStatus.COMPLETED]: 'Đã hoàn thành',
  [BookingStatus.CANCELLED]: 'Đã hủy',
  [BookingStatus.EXPIRED]: 'Hết hạn',
};
