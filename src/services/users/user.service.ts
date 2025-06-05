import { User } from '../../interfaces/user.interface';
import { db } from '../../config/firebase';

export class UserService {
  async getUserProfile(userId: string): Promise<User> {
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error('Usuario no encontrado');
    }

    return userDoc.data() as User;
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<User> {
    const userRef = db.collection('users').doc(userId);
    
    await userRef.update({
      ...data,
      updatedAt: new Date()
    });

    const updatedDoc = await userRef.get();
    return updatedDoc.data() as User;
  }

  async getUserPredictions(userId: string): Promise<any[]> {
    const predictionsSnapshot = await db
      .collection('predictions')
      .where('userId', '==', userId)
      .get();

    return predictionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getUserStats(userId: string): Promise<any> {
    const predictionsSnapshot = await db
      .collection('predictions')
      .where('userId', '==', userId)
      .get();

    const predictions = predictionsSnapshot.docs.map(doc => doc.data());
    
    return {
      totalPredictions: predictions.length,
      correctPredictions: predictions.filter(p => p.isCorrect).length,
      accuracy: predictions.length > 0 
        ? (predictions.filter(p => p.isCorrect).length / predictions.length) * 100 
        : 0
    };
  }
} 