export enum IssueType {
  TECHNICAL = 'TECHNICAL',
  CLEANING = 'CLEANING',
  NOISE = 'NOISE',
  SECURITY = 'SECURITY',
  FIRE = 'FIRE',
  OTHERS = 'OTHERS',
}

export const IssueTypeLabels = {
  [IssueType.TECHNICAL]: 'Kỹ thuật',
  [IssueType.CLEANING]: 'Vệ sinh',
  [IssueType.NOISE]: 'Tiếng ồn',
  [IssueType.SECURITY]: 'An ninh',
  [IssueType.FIRE]: 'Phòng cháy chữa cháy',
  [IssueType.OTHERS]: 'Khác',
};
