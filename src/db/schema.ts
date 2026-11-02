import { pgTable, serial, text, timestamp, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['student', 'parent', 'admin', 'co_admin', 'faculty', 'warden', 'security']);
export const permissionStatusEnum = pgEnum('permission_status', ['draft', 'parent_pending', 'warden_pending', 'approved', 'rejected', 'cancelled']);
export const logTypeEnum = pgEnum('log_type', ['OUT', 'RETURN']);

// Core Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID
  email: text('email').notNull().unique(),
  username: text('username'), 
  name: text('name').notNull(),
  phone: text('phone'),
  photoUrl: text('photo_url'),
  role: userRoleEnum('role').notNull().default('student'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
  isActive: boolean('is_active').default(true).notNull(),
  forcePasswordChange: boolean('force_password_change').default(false).notNull(),
});

// Student details
export const students = pgTable('students', {
  id: integer('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  idNo: text('id_no').notNull().unique(),
  department: text('department').notNull(),
  year: text('year').notNull(),
  hostel: text('hostel').notNull(),
  room: text('room').notNull(),
  parentName: text('parent_name'),
  parentEmail: text('parent_email').notNull(),
  parentPhone: text('parent_phone').notNull(),
  emergencyContact: text('emergency_contact').notNull(),
  signatureUrl: text('signature_url'),
});

// Staff details (Faculty, Warden, Security)
export const staff = pgTable('staff', {
  id: integer('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id').notNull().unique(),
  department: text('department'),
  designation: text('designation').notNull(),
  assignedLocation: text('assigned_location'), // Hostel Block for Wardens, Gate for Security
  shift: text('shift'), // For Security
});

// Permission requests
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  uniqueId: text('unique_id').notNull().unique(), // nanoid
  studentId: integer('student_id').notNull().references(() => students.id),
  type: text('type').notNull(), // 'Outing' or 'Holiday'
  destination: text('destination').notNull(),
  purpose: text('purpose').notNull(),
  departureAt: timestamp('departure_at').notNull(),
  returnAt: timestamp('return_at').notNull(),
  status: permissionStatusEnum('status').notNull().default('parent_pending'),
  parentApprovalToken: text('parent_approval_token'),
  parentTokenExpiry: timestamp('parent_token_expiry'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  studentSignature: text('student_signature'), // Base64 signature
  pdfUrl: text('pdf_url'),
});

// Approval trail
export const approvals = pgTable('approvals', {
  id: serial('id').primaryKey(),
  permissionId: integer('permission_id').notNull().references(() => permissions.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'parent', 'faculty', 'warden'
  approverId: integer('approver_id').references(() => users.id),
  approverName: text('approver_name'), 
  status: text('status').notNull(), // 'approved' or 'rejected'
  remarks: text('remarks'),
  signatureUrl: text('signature_url'), // Base64 signature
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
});

// Gate security logs
export const gateLogs = pgTable('gate_logs', {
  id: serial('id').primaryKey(),
  permissionId: integer('permission_id').notNull().references(() => permissions.id),
  staffId: integer('staff_id').notNull().references(() => users.id),
  type: logTypeEnum('type').notNull(), // 'OUT' or 'RETURN'
  method: text('method').notNull().default('QR'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audit Logs
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type'),
  entityId: text('entity_id'),
  details: jsonb('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(students, {
    fields: [users.id],
    references: [students.id],
  }),
  staffProfile: one(staff, {
    fields: [users.id],
    references: [staff.id],
  }),
  approvals: many(approvals),
  gateLogs: many(gateLogs),
  auditLogs: many(auditLogs),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, {
    fields: [students.id],
    references: [users.id],
  }),
  permissions: many(permissions),
}));

export const staffRelations = relations(staff, ({ one }) => ({
  user: one(users, {
    fields: [staff.id],
    references: [users.id],
  }),
}));

export const permissionsRelations = relations(permissions, ({ one, many }) => ({
  student: one(students, {
    fields: [permissions.studentId],
    references: [students.id],
  }),
  approvals: many(approvals),
  gateLogs: many(gateLogs),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  permission: one(permissions, {
    fields: [approvals.permissionId],
    references: [permissions.id],
  }),
  approver: one(users, {
    fields: [approvals.approverId],
    references: [users.id],
  }),
}));

