export interface FileAsset {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadDate: string; // ISO format for sorting
  status: 'Approved' | 'In Progress';
  tag: 'Final' | 'Draft' | 'Other';
  thumbnail?: string;
}
