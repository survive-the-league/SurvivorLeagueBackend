import * as admin from 'firebase-admin';
import { env } from './env';

const serviceAccount = {
  ...env.firebase,
  privateKey: env.firebase.privateKey?.replace(/\\n/g, '\n')
};

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
});

export const db = app.firestore();
export const auth = app.auth(); 