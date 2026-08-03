export interface SpaceRow {
  id: string;
  name: string;
  dept: string;
  level: string;
  uni: string;
  rep_id: number;
  invite_code: string;
  created_at?: string;
}

export interface CourseRow {
  id: number;
  space_id: string;
  name: string;
  code: string;
  icon: string;
  color_index: number;
}

export interface UserRow {
  id: number;
  name: string;
  email: string;
  password_hash?: string;
  role: string;
  avatar?: string | null;
}

export interface MembershipRow {
  role: string;
}

export interface ReactionRow {
  announcement_id: number;
  emoji: string;
  count: number;
}

export interface MyReactionRow {
  announcement_id: number;
  emoji: string;
}

export interface AttachmentRow {
  id: number;
  file_url?: string;
  file_name: string;
  file_size: number;
}

export interface AnnouncementRow {
  id: number;
  space_id: string;
  course_id?: number | null;
  title: string;
  body: string;
  type: string;
  author_id: number;
  urgent?: number;
  pinned?: number;
  deadline?: string | null;
  venue?: string | null;
  instructions?: string | null;
  submission_method?: string | null;
  format?: string | null;
  file_data?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  created_at: string;
  author_name?: string;
  course_name?: string;
  course_code?: string;
  course_icon?: string;
  space_name?: string;
}

export interface MaterialRow {
  id: number;
  space_id: string;
  course_id: number;
  name: string;
  file_data?: string | null;
  file_type: string;
  category: string;
  file_size?: number;
  uploader_id: number;
  pinned?: number;
  downloads?: number;
  created_at: string;
  has_file?: number;
  uploader_name?: string;
  course_name?: string;
  course_code?: string;
  course_icon?: string;
  space_name?: string;
}

export interface OpportunityRow {
  id: number;
  space_id: string;
  author_id: number;
  title: string;
  description: string;
  category: string;
  link?: string | null;
  deadline?: string | null;
  pinned?: number;
  created_at: string;
  author_name?: string;
}

export interface TimetableRow {
  id: number;
  space_id: string;
  course_id: number;
  day: string;
  start_time: string;
  end_time: string;
  venue?: string | null;
  lecturer?: string | null;
  course_name?: string;
  course_code?: string;
  course_icon?: string;
  color_index?: number;
}
