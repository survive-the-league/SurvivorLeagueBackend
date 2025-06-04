export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  lives: number;
  predictions: string[];
  password: string;
}

export interface UserWithoutPassword extends Omit<User, 'password'> {}