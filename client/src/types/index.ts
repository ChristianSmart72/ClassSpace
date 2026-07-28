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
  reactions?: Record<string, number>;
  my_reaction?: string | null;
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
  pinned?: boolean;
  downloads?: number;
}

export interface TimetableEntry {
  id: number;
  space_id: string;
  course_id: number;
  day: string;
  start_time: string;
  end_time: string;
  venue: string | null;
  lecturer: string | null;
  course_name: string;
  course_code: string;
  course_icon: string;
  color_index: number;
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
  'Slides', 'Assignments', 'Past Questions',
  'Lab Resources', 'Books', 'Templates', 'Other',
] as const;

export const FILE_ICONS: Record<string, string> = {
  pdf: '📄', doc: '📝', ppt: '📊', xls: '📈',
  img: '🖼️', video: '🎬', other: '📁',
};

export const FILE_COLORS: Record<string, string> = {
  pdf: 'text-app-red', doc: 'text-app-accent2', ppt: 'text-app-orange',
  xls: 'text-app-green', img: 'text-app-accent2', video: 'text-app-red', other: 'text-app-text-dim',
};

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const COURSE_COLORS = ['#e8ff47', '#5b6af0', '#52ffa0', '#ffb347', '#ff5252'];
export const COURSE_BG_COLORS = [
  'rgba(232,255,71,0.12)', 'rgba(91,106,240,0.12)',
  'rgba(82,255,160,0.12)', 'rgba(255,179,71,0.12)', 'rgba(255,82,82,0.12)',
];

// Reactions are now upvote/downvote
export const REACTION_KEYS = ['upvote', 'downvote'] as const;
export type ReactionKey = typeof REACTION_KEYS[number];

// Legacy — kept for any imports that reference it
export const REACTION_EMOJIS = ['upvote', 'downvote'] as const;

export interface PollOption {
  id: number;
  poll_id?: number;
  text: string;
  display_order: number;
  votes: number;
}

export interface Poll {
  id: number;
  space_id: string;
  author_id: number;
  author_name: string;
  question: string;
  closes_at: string | null;
  created_at: string;
  options: PollOption[];
  total_votes: number;
  my_vote?: number | null;
}

export interface Opportunity {
  id: number;
  space_id: string;
  author_id: number;
  author_name: string;
  title: string;
  description: string;
  category: string;
  link: string | null;
  deadline: string | null;
  created_at: string;
}

export const OPPORTUNITY_CATEGORIES = [
  { value: 'seminar', label: 'Seminar', icon: '🎓', color: '#5b6af0' },
  { value: 'scholarship', label: 'Scholarship', icon: '🏆', color: '#e8ff47' },
  { value: 'internship', label: 'Internship', icon: '💼', color: '#52ffa0' },
  { value: 'job', label: 'Job', icon: '🧑‍💻', color: '#ffb347' },
  { value: 'competition', label: 'Competition', icon: '🥇', color: '#ff5252' },
  { value: 'event', label: 'Event', icon: '📅', color: '#a78bfa' },
  { value: 'other', label: 'Other', icon: '📌', color: '#7a7a88' },
] as const;
