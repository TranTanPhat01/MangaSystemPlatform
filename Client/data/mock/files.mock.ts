export interface MockFileItem {
  id: string;
  name: string;
  size: string;
  uploader: string;
  date: string;
  isMock: boolean;
}

export const mockFiles: MockFileItem[] = [
  { id: 'mock-1', name: 'ch43_draft_storyboard.pdf', size: '14.2 MB', uploader: 'Mangaka Oda', date: 'May 23, 2026', isMock: true },
  { id: 'mock-2', name: 'ch43_backgrounds_inked.psd', size: '284.5 MB', uploader: 'Assistant Tanaka', date: 'May 22, 2026', isMock: true },
];
