export type Role = 'admin' | 'guru';

export type User = {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
};

export type AttendanceStatus = 'present' | 'sick' | 'permission' | 'absent';

export type Attendance = {
  present: number;
  sick: number;
  permission: number;
  absent: number;
};

export type JournalEntry = {
  id: string;
  teacherId: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  topic: string;
  learningObjective?: string;
  attendance: Attendance;
  studentAttendance?: Record<string, AttendanceStatus>;
  absentStudentNames?: string;
  grades?: Record<string, number>;
  notes: string;
  photoUrl?: string;
  createdAt: string;
};
