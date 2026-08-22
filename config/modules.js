/**
 * Central System Modules Registry
 * Single Source of Truth for feature modules across backend and frontends.
 */

const SYSTEM_MODULES = [
  {
    key: 'students',
    label: 'Students Directory',
    icon: 'Users',
    path: '/students',
    description: 'Student profiles, admission, parent contact & NFC IDs',
    isCore: true
  },
  {
    key: 'transport',
    label: 'Smart Bus & Transport',
    icon: 'Bus',
    path: '/transport',
    description: 'Fleet GPS live tracking, routes, stops, and bus NFC driver logs'
  },
  {
    key: 'academics',
    label: 'Classes & Sections',
    icon: 'BookOpen',
    path: '/classes',
    description: 'Classes, sections, and class teacher assignments'
  },
  {
    key: 'teachers',
    label: 'Teachers & Staff',
    icon: 'GraduationCap',
    path: '/teachers',
    description: 'Faculty profiles and class assignments'
  },
  {
    key: 'attendance',
    label: 'Classroom Attendance',
    icon: 'Calendar',
    path: '/attendance',
    description: 'Daily classroom attendance and reports'
  },
  {
    key: 'timetable',
    label: 'Timetable & Periods',
    icon: 'Clock',
    path: '/timetable',
    description: 'Class-wise timetable matrix and period allocation'
  },
  {
    key: 'fees',
    label: 'Student Fees',
    icon: 'Landmark',
    path: '/fees',
    description: 'Fee structures, invoices, and payment tracking'
  },
  {
    key: 'academic_years',
    label: 'Academic Years',
    icon: 'CalendarDays',
    path: '/academic-years',
    description: 'Session terms and academic calendar'
  }
];

const DEFAULT_PACKAGES = [
  {
    code: 'TRANSPORT_ONLY',
    name: 'Smart Bus & Transport Only',
    description: 'Dedicated fleet GPS live tracking, bus routes, stops, bus NFC driver tap logs, and student transit management.',
    icon: 'Bus',
    badge_color: 'amber',
    modules: ['transport', 'students'],
    is_active: true,
    sort_order: 1
  },
  {
    code: 'SCHOOL_ONLY',
    name: 'School ERP Standard',
    description: 'Complete academic management: classes, teachers, students, timetable matrix, student fees, and classroom attendance.',
    icon: 'BookOpen',
    badge_color: 'blue',
    modules: ['academics', 'teachers', 'students', 'timetable', 'fees', 'attendance', 'academic_years'],
    is_active: true,
    sort_order: 2
  },
  {
    code: 'FULL_SUITE',
    name: 'Full Suite (School + Transport)',
    description: 'Complete all-in-one School ERP integrated with Smart Bus Live GPS Fleet Tracking and NFC telemetry.',
    icon: 'Layers',
    badge_color: 'indigo',
    modules: ['academics', 'teachers', 'students', 'timetable', 'fees', 'attendance', 'academic_years', 'transport'],
    is_active: true,
    sort_order: 3
  }
];

module.exports = {
  SYSTEM_MODULES,
  DEFAULT_PACKAGES
};
