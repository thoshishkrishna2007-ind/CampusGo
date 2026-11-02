import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from '../lib/firebase-admin.ts';
import * as dotenv from 'dotenv';

dotenv.config();

const DEFAULT_ACCOUNTS = [
  {
    email: 'admin@campusgo.local',
    password: 'Admin@12345',
    username: 'admin',
    name: 'System Administrator',
    role: 'admin'
  },
  {
    email: 'coadmin@campusgo.local',
    password: 'CoAdmin@12345',
    username: 'coadmin',
    name: 'Academic Warden',
    role: 'co_admin'
  },
  {
    email: 'faculty@campusgo.local',
    password: 'Faculty@12345',
    username: 'faculty',
    name: 'Faculty Member',
    role: 'faculty'
  },
  {
    email: 'security@campusgo.local',
    password: 'Security@12345',
    username: 'security',
    name: 'Security Officer',
    role: 'security'
  }
];

async function seed() {
  console.log('🚀 Seeding database and Firebase accounts...');
  
  for (const account of DEFAULT_ACCOUNTS) {
    try {
      let firebaseUser;
      try {
        firebaseUser = await adminAuth.getUserByEmail(account.email);
        console.log(`- User ${account.email} already exists in Firebase.`);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found') {
          firebaseUser = await adminAuth.createUser({
            email: account.email,
            password: account.password,
            displayName: account.name,
          });
          console.log(`+ Created Firebase user for ${account.email}`);
        } else {
          throw e;
        }
      }

      await db.insert(users).values({
        uid: firebaseUser.uid,
        email: account.email,
        username: account.username,
        name: account.name,
        role: account.role as any,
        forcePasswordChange: true
      }).onConflictDoUpdate({
        target: users.email,
        set: { uid: firebaseUser.uid, role: account.role as any }
      });

    } catch (error) {
      console.error(`FAILED to seed ${account.email}:`, error);
    }
  }

  console.log('✅ Seed completed successfully');
}

seed().catch(console.error);
