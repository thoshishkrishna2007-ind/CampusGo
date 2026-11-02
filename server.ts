import express from 'express';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { users, students, permissions, approvals, gateLogs, staff, auditLogs } from './src/db/schema.ts';
import { eq, and, or } from 'drizzle-orm';
import { requireAuth, requireRole, AuthRequest } from './src/middleware/auth.ts';
import { sendEmail } from './src/lib/resend.ts';
import { nanoid } from 'nanoid';
import { addDays, format } from 'date-fns';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';
import { adminAuth } from './src/lib/firebase-admin.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  const api = express.Router();

  // Public Approval Route for Parents (Token based)
  api.get('/public/permission/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.parentApprovalToken, token),
        with: { student: { with: { user: true } } }
      });

      if (!permission || (permission.parentTokenExpiry && permission.parentTokenExpiry < new Date())) {
        return res.status(404).json({ error: 'Invalid or expired approval link' });
      }

      res.json(permission);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch permission' });
    }
  });

  api.post('/public/permission/:token/approve', async (req, res) => {
    try {
      const { token } = req.params;
      const { status, remarks, signature } = req.body;

      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.parentApprovalToken, token)
      });

      if (!permission || (permission.parentTokenExpiry && permission.parentTokenExpiry < new Date())) {
        return res.status(404).json({ error: 'Invalid or expired approval link' });
      }

      await db.transaction(async (tx) => {
        await tx.insert(approvals).values({
          permissionId: permission.id,
          role: 'parent',
          status,
          remarks,
          signatureUrl: signature,
          approverName: 'Parent/Guardian',
          metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
        });

        await tx.update(permissions)
          .set({ 
            status: status === 'approved' ? 'warden_pending' : 'rejected',
            parentApprovalToken: null // Expire the token
          })
          .where(eq(permissions.id, permission.id));
      });

      res.json({ message: 'Response recorded successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process approval' });
    }
  });

  // Helper for Audit Logging
  const logAudit = async (userId: number | null, action: string, entityType?: string, entityId?: string, details?: any) => {
    try {
      await db.insert(auditLogs).values({
        userId,
        action,
        entityType,
        entityId,
        details,
        createdAt: new Date()
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  };

  // Authenticated Routes
  api.post('/auth/register', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { uid, email, name, username, role, studentData, staffData } = req.body;
      
      const newUser = await db.insert(users).values({
        uid, email, name, username: username || email.split('@')[0], 
        role: role || 'student',
        forcePasswordChange: false // Registration implies setting a password
      }).onConflictDoUpdate({
        target: users.uid,
        set: { name, email, username }
      }).returning();

      const userRecord = newUser[0];

      if (userRecord.role === 'student' && studentData) {
        await db.insert(students).values({
          id: userRecord.id,
          ...studentData
        }).onConflictDoUpdate({
          target: students.id,
          set: studentData
        });
      } else if (['admin', 'co_admin', 'faculty', 'warden', 'security'].includes(userRecord.role) && staffData) {
        await db.insert(staff).values({
          id: userRecord.id,
          ...staffData
        }).onConflictDoUpdate({
          target: staff.id,
          set: staffData
        });
      }

      await logAudit(userRecord.id, 'ACCOUNT_REGISTERED', 'users', userRecord.id.toString());
      res.json(userRecord);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  api.post('/auth/change-password', requireAuth, async (req: AuthRequest, res) => {
    try {
      await db.update(users).set({ forcePasswordChange: false }).where(eq(users.id, req.user!.dbUser.id));
      await logAudit(req.user!.dbUser.id, 'PASSWORD_CHANGED', 'users', req.user!.dbUser.id.toString());
      res.json({ message: 'Status updated' });
    } catch (error) {
      res.status(500).json({ error: 'Update failed' });
    }
  });

  api.get('/user/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const userRecord = await db.query.users.findFirst({
        where: eq(users.uid, req.user!.uid),
        with: { studentProfile: true, staffProfile: true }
      });
      res.json(userRecord);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  api.put('/user/profile', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { name, phone, photoUrl, studentData, staffData } = req.body;
      const userId = req.user!.dbUser.id;
      const role = req.user!.dbUser.role;

      await db.transaction(async (tx) => {
        await tx.update(users).set({ name, phone, photoUrl, updatedAt: new Date() }).where(eq(users.id, userId));
        
        if (role === 'student' && studentData) {
           // Allow updating some student fields (room, contacts)
           await tx.update(students).set({
             room: studentData.room,
             parentPhone: studentData.parentPhone,
             emergencyContact: studentData.emergencyContact
           }).where(eq(students.id, userId));
        } else if (staffData && ['admin', 'co_admin', 'faculty', 'warden', 'security'].includes(role)) {
           // Staff can update designation/dept if needed (or restricted)
           await tx.update(staff).set({
             designation: staffData.designation,
             department: staffData.department
           }).where(eq(staff.id, userId));
        }
      });

      await logAudit(userId, 'PROFILE_UPDATED', 'users', userId.toString());
      res.json({ message: 'Profile updated' });
    } catch (error) {
      res.status(500).json({ error: 'Update failed' });
    }
  });

  // Admin: User Management
  api.get('/admin/users', requireAuth, requireRole(['admin', 'co_admin']), async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        with: { studentProfile: true, staffProfile: true },
        orderBy: (u, { desc }) => [desc(u.createdAt)]
      });
      res.json(allUsers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  api.post('/admin/users', requireAuth, requireRole(['admin']), async (req: AuthRequest, res) => {
    try {
      const { email, name, username, role, studentData, staffData } = req.body;
      
      // Create actual Firebase user
      const tempPassword = `Campus@${nanoid(6)}`;
      let firebaseUser;
      try {
        firebaseUser = await adminAuth.createUser({
          email,
          password: tempPassword,
          displayName: name,
        });
      } catch (e: any) {
        if (e.code === 'auth/email-already-exists') {
          firebaseUser = await adminAuth.getUserByEmail(email);
        } else {
          throw e;
        }
      }

      const newUser = await db.insert(users).values({
        uid: firebaseUser.uid,
        email, 
        name, 
        username: username || email.split('@')[0],
        role,
        forcePasswordChange: true,
        isActive: true
      }).onConflictDoUpdate({
        target: users.email,
        set: { uid: firebaseUser.uid, name, role }
      }).returning();

      const userRecord = newUser[0];

      if (role === 'student' && studentData) {
        await db.insert(students).values({ id: userRecord.id, ...studentData }).onConflictDoUpdate({
          target: students.id,
          set: studentData
        });
      } else if (staffData) {
        await db.insert(staff).values({ id: userRecord.id, ...staffData }).onConflictDoUpdate({
          target: staff.id,
          set: staffData
        });
      }

      // In a real app, send an email with tempPassword here
      console.log(`User created: ${email} with temp password: ${tempPassword}`);

      await logAudit(req.user!.dbUser.id, 'USER_CREATED', 'users', userRecord.id.toString(), { role });
      res.json({ ...userRecord, tempPassword });
    } catch (error: any) {
      console.error('User creation failed:', error);
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  });

  // Student: Request Permission
  api.post('/permissions/request', requireAuth, requireRole(['student']), async (req: AuthRequest, res) => {
    try {
      const { type, destination, purpose, departureAt, returnAt, studentSignature } = req.body;
      const studentId = req.user!.dbUser.id;
      const token = nanoid(32);
      
      const newPermission = await db.insert(permissions).values({
        uniqueId: nanoid(10).toUpperCase(),
        studentId,
        type,
        destination,
        purpose,
        departureAt: new Date(departureAt),
        returnAt: new Date(returnAt),
        studentSignature,
        parentApprovalToken: token,
        parentTokenExpiry: addDays(new Date(), 2),
        status: 'parent_pending'
      }).returning();

      const student = await db.query.students.findFirst({
        where: eq(students.id, studentId)
      });

      if (student) {
        const approvalLink = `${process.env.APP_URL}/parent/approve/${token}`;
        await sendEmail({
          to: student.parentEmail,
          subject: `Permission Request: ${req.user!.dbUser.name} (${newPermission[0].uniqueId})`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5dec9; border-radius: 8px; overflow: hidden;">
              <div style="background-color: #101629; color: #f5f0e6; padding: 24px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">CampusGo</h1>
                <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.8;">Aditya College of Engineering, Madanapalle</p>
              </div>
              <div style="padding: 24px; background-color: #fef9ef; color: #1d1c16;">
                <p>Dear Parent/Guardian,</p>
                <p>Your child, <b>${req.user!.dbUser.name}</b>, has submitted a hostel permission request for your approval.</p>
                
                <div style="background-color: #f2ede3; padding: 16px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;"><b>Type:</b> ${type}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><b>Destination:</b> ${destination}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><b>Purpose:</b> ${purpose}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><b>Departure:</b> ${format(new Date(departureAt), 'PPP p')}</p>
                  <p style="margin: 4px 0; font-size: 14px;"><b>Expected Return:</b> ${format(new Date(returnAt), 'PPP p')}</p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                  <a href="${approvalLink}" style="background-color: #D5AD65; color: #101629; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Review & Respond</a>
                </div>

                <p style="font-size: 12px; color: #45464d;">This is a secure, single-use link that expires in 48 hours. If you did not expect this request, please contact the college hostel warden immediately.</p>
              </div>
              <div style="background-color: #ede8de; padding: 12px; text-align: center; font-size: 10px; color: #76767e;">
                &copy; ${new Date().getFullYear()} Aditya College of Engineering. All rights reserved.
              </div>
            </div>
          `
        });
      }

      res.json(newPermission[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create request' });
    }
  });

  // Admin: Stats
  api.get('/admin/stats', requireAuth, requireRole(['admin', 'co_admin']), async (req, res) => {
    try {
      const studentCount = await db.select().from(students);
      const pendingCount = await db.query.permissions.findMany({ where: eq(permissions.status, 'warden_pending') });
      const approvedCount = await db.query.permissions.findMany({ where: eq(permissions.status, 'approved') });
      
      res.json({
        totalStudents: studentCount.length,
        pendingClearances: pendingCount.length,
        activePermissions: approvedCount.length,
        securityIncidents: 0
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Warden: Review and Approve
  api.get('/permissions/pending-review', requireAuth, requireRole(['faculty', 'admin']), async (req, res) => {
    try {
      const pending = await db.query.permissions.findMany({
        where: eq(permissions.status, 'warden_pending'),
        with: { student: { with: { user: true } } }
      });
      res.json(pending);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch pending requests' });
    }
  });

  api.post('/permissions/warden-approve', requireAuth, requireRole(['faculty', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { permissionId, status, remarks, signature } = req.body;
      
      await db.transaction(async (tx) => {
        await tx.insert(approvals).values({
          permissionId,
          role: 'warden',
          approverId: req.user!.dbUser.id,
          status,
          remarks,
          signatureUrl: signature
        });

        await tx.update(permissions)
          .set({ status: status === 'approved' ? 'approved' : 'rejected' })
          .where(eq(permissions.id, permissionId));
      });

      res.json({ message: 'Decision recorded' });
    } catch (error) {
      res.status(500).json({ error: 'Approval failed' });
    }
  });

  // Gate Verification
  api.get('/gate/verify/:uniqueId', requireAuth, requireRole(['security', 'admin']), async (req, res) => {
    try {
      const { uniqueId } = req.params;
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.uniqueId, uniqueId),
        with: { 
          student: { with: { user: true } },
          gateLogs: true,
          approvals: true
        }
      });

      if (!permission) return res.status(404).json({ error: 'Permission not found' });
      res.json(permission);
    } catch (error) {
      res.status(500).json({ error: 'Verification failed' });
    }
  });

  // Student: Get My Permissions
  api.get('/permissions/my', requireAuth, requireRole(['student']), async (req: AuthRequest, res) => {
    try {
      const myRequests = await db.query.permissions.findMany({
        where: eq(permissions.studentId, req.user!.dbUser.id),
        orderBy: (p, { desc }) => [desc(p.createdAt)]
      });
      res.json(myRequests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch requests' });
    }
  });

  // Security: Record Event
  api.post('/gate/log', requireAuth, requireRole(['security', 'admin']), async (req: AuthRequest, res) => {
    try {
      const { permissionId, type } = req.body;
      
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.id, permissionId),
        with: { gateLogs: true }
      });

      if (!permission || permission.status !== 'approved') {
        return res.status(400).json({ error: 'Invalid or unauthorized permission' });
      }

      const hasOut = permission.gateLogs.some(log => log.type === 'OUT');
      const hasReturn = permission.gateLogs.some(log => log.type === 'RETURN');

      if (type === 'OUT') {
        if (hasOut) return res.status(400).json({ error: 'Student already checked OUT' });
      } else if (type === 'RETURN') {
        if (!hasOut) return res.status(400).json({ error: 'Student must check OUT before returning' });
        if (hasReturn) return res.status(400).json({ error: 'Student already checked in as RETURNED' });
      }

      await db.insert(gateLogs).values({
        permissionId,
        staffId: req.user!.dbUser.id,
        type,
        method: 'QR'
      });

      await logAudit(req.user!.dbUser.id, `GATE_${type}`, 'permissions', permissionId.toString());
      res.json({ message: 'Event recorded successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record event' });
    }
  });

  // PDF Generation / Printable Slip
  api.get('/permissions/:id/pdf', requireAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const permission = await db.query.permissions.findFirst({
        where: eq(permissions.id, parseInt(id)),
        with: { 
          student: { with: { user: true } }, 
          approvals: { with: { approver: true } } 
        }
      });

      if (!permission || permission.status !== 'approved') {
        return res.status(403).json({ error: 'Permission not fully authorized for slip generation' });
      }

      // Check if student belongs to this permission
      if (req.user!.dbUser.role === 'student' && permission.studentId !== req.user!.dbUser.id) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      // Generate PDF
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Header
      page.drawText('ADITYA COLLEGE OF ENGINEERING, MADANAPALLE', {
        x: 50, y: height - 60, size: 18, font: fontBold, color: rgb(0.06, 0.09, 0.16)
      });
      page.drawText('Smart Hostel Outing & Holiday Permission Slip', {
        x: 50, y: height - 85, size: 12, font: fontRegular, color: rgb(0.46, 0.46, 0.49)
      });
      page.drawLine({
        start: { x: 50, y: height - 100 },
        end: { x: width - 50, y: height - 100 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });

      // QR Code
      const qrDataUrl = await QRCode.toDataURL(permission.uniqueId, { margin: 1 });
      const qrImage = await pdfDoc.embedPng(qrDataUrl);
      page.drawImage(qrImage, {
        x: width - 150, y: height - 210, width: 100, height: 100
      });
      page.drawText(`ID: ${permission.uniqueId}`, {
        x: width - 150, y: height - 225, size: 10, font: fontBold
      });

      // Student Info
      let y = height - 140;
      const drawField = (label: string, value: string) => {
        page.drawText(label + ':', { x: 50, y, size: 10, font: fontBold });
        page.drawText(value, { x: 160, y, size: 10, font: fontRegular });
        y -= 20;
      };

      drawField('Student Name', permission.student.user.name);
      drawField('Register No', permission.student.idNo);
      drawField('Department', permission.student.department);
      drawField('Year of Study', permission.student.year);
      drawField('Hostel & Room', `${permission.student.hostel} - ${permission.student.room}`);
      
      y -= 10;
      page.drawLine({ start: { x: 50, y }, end: { x: width - 50, y }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) });
      y -= 25;

      drawField('Permission Type', permission.type);
      drawField('Destination', permission.destination);
      drawField('Purpose', permission.purpose);
      drawField('Departure', format(new Date(permission.departureAt), 'PPP p'));
      drawField('Expected Return', format(new Date(permission.returnAt), 'PPP p'));

      // Approvals
      y -= 20;
      page.drawText('Authorization Status', { x: 50, y, size: 12, font: fontBold });
      y -= 30;

      for (const approval of permission.approvals) {
        const approverName = approval.approver?.name || approval.approverName || 'Authorized Official';
        page.drawText(`${approval.role.toUpperCase()}:`, { x: 50, y, size: 10, font: fontBold });
        page.drawText(`${approval.status.toUpperCase()} by ${approverName} on ${format(new Date(approval.createdAt), 'PPP')}`, {
          x: 160, y, size: 10, font: fontRegular
        });
        
        if (approval.signatureUrl && approval.signatureUrl.startsWith('data:image/png;base64,')) {
           try {
             const sigImage = await pdfDoc.embedPng(approval.signatureUrl);
             page.drawImage(sigImage, { x: 160, y: y - 45, width: 80, height: 40 });
             y -= 50;
           } catch (e) {
             y -= 20;
           }
        } else {
           y -= 20;
        }
      }

      // Footer
      page.drawText('This is a computer-generated document. Digital verification via QR code is required at the gate.', {
        x: 50, y: 50, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5)
      });

      const pdfBytes = await pdfDoc.save();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="CampusGo_${permission.uniqueId}.pdf"`);
      res.send(Buffer.from(pdfBytes));
    } catch (error) {
      console.error('PDF Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate PDF slip' });
    }
  });

  app.use('/api', api);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
  });
}

startServer();
