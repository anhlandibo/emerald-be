export enum IssueStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  RESOLVED = 'RESOLVED',
}

export const IssueStatusLabels = {
  [IssueStatus.PENDING]: 'Chờ tiếp nhận',
  [IssueStatus.RECEIVED]: 'Đã tiếp nhận',
  [IssueStatus.PROCESSING]: 'Đang xử lý',
  [IssueStatus.RESOLVED]: 'Đã giải quyết',
};
