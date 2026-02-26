export type Attendance = {
  present: number;
  sick: number;
  permission: number;
  absent: number;
};

export type JournalEntry = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  subject: string;
  topic: string;
  attendance: Attendance;
  notes: string;
  createdAt: string;
};
