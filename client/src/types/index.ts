export interface User {
  id: number;
  name: string;
  email: string;
  role: 'rep' | 'member';
  avatar: string | null;
  created_at?: string;
}

export interface Space {
  id: string;
  name: string;
  dept: string;
  level: string;
  uni: string;
  rep_id: number;
  invite_code: string;
  created_at: string;
  rep?: string;
  courses?: Course[];
}

export interface Course {
  id: number;
  space_id: string;
  name: string;
  code: string;
  icon: string;
  color_index: number;
  file_count?: number;
}

export interface Announcement {
  id: number;
  space_id: string;
  course_id: number | null;
  title: string;
  body: string;
  type: 'assignment' | 'test' | 'meeting' | 'update' | 'announcement';
  author_id: number;
  author_name: string;
  urgent: boolean;
  pinned: boolean;
  deadline: string | null;
  venue: string | null;
  instructions: string | null;
  submission_method: string | null;
  format: string | null;
  created_at: string;
  course_name?: string;
  course_code?: string;
  course_icon?: string;
}

export interface Material {
  id: number;
  space_id: string;
  course_id: number;
  name: string;
  file_data?: string;
  file_size: number;
  file_type: string;
  category: string;
  uploader_id: number;
  uploader_name?: string;
  created_at: string;
  course_name?: string;
  course_code?: string;
}

export interface SharedSpace {
  type: 'space';
  id: string;
  name: string;
  dept: string;
  level: string;
  uni: string;
  rep: string;
  invite_code: string;
  announcementTeaser: string | null;
}

export interface SharedAnnouncement {
  type: 'announcement';
  id: number;
  title: string;
  body: string;
  author: string;
  time: string;
  urgent: boolean;
  pinned: boolean;
  type_label: string;
  course: { name: string; code: string; icon: string } | null;
  space: { id: string; name: string };
}

export interface SharedMaterial {
  type: 'material';
  id: number;
  name: string;
  file_type: string;
  category: string;
  file_size: number;
  uploader: string;
  course: { name: string; code: string; icon: string };
  space: { id: string; name: string };
}

export interface SharedCourse {
  type: 'course';
  id: number;
  name: string;
  code: string;
  icon: string;
  color_index: number;
  files: { id: number; name: string; file_type: string; category: string; file_size: number }[];
  totalFiles: number;
  space: { id: string; name: string };
}

export type ShareData = SharedSpace | SharedAnnouncement | SharedMaterial | SharedCourse;

export const ANNOUNCEMENT_TYPES = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'assignment', label: 'Assignment' },
  { value: 'test', label: 'Test' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'update', label: 'Update' },
] as const;

export const MATERIAL_CATEGORIES = [
  'Notes', 'Slides', 'Assignments', 'Past Questions',
  'Textbooks', 'Lab Resources', 'Templates', 'Other',
] as const;

export const FILE_ICONS: Record<string, string> = {
  pdf: '📄', doc: '📝', ppt: '📊', xls: '📈',
  img: '🖼️', video: '🎬', other: '📁',
};

export const FILE_COLORS: Record<string, string> = {
  pdf: 'text-app-red', doc: 'text-app-accent2', ppt: 'text-app-orange',
  xls: 'text-app-green', img: 'text-app-accent2', video: 'text-app-red', other: 'text-app-text-dim',
};
