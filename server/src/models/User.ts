import {Schema, model} from 'mongoose';

interface IUser {
  name: string;
  email: string;
  password: string;
  roll: 'user' | 'admin';
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    roll: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

const User = model<IUser>('User', userSchema);

export default User;