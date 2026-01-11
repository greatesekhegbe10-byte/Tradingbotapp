
import { UserProfile } from '../types';

/**
 * NEXUS AUTH PROTOCOL v4.0
 * Mocks full-stack authentication behavior including JWT simulation and hashing delays.
 */

export const registerUser = async (fullName: string, email: string, pass: string) => {
  // Simulate network delay and bcrypt hashing
  await new Promise(resolve => setTimeout(resolve, 1800));
  
  // Simulation of database constraint
  if (email === 'taken@gmail.com') throw new Error("Email already registered in the cluster.");

  return {
    success: true,
    message: "Provisioning successful. Verification email dispatched to node.",
    user: {
      id: 'NX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      name: fullName,
      email: email,
      tier: 'BASIC',
      role: 'NONE',
      isEmailVerified: false
    }
  };
};

export const loginUser = async (email: string, pass: string) => {
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Special Case: Root Bypass Check is handled in AuthPage component for Alex
  
  return {
    success: true,
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "def456...",
    user: {
      id: 'NX-VERIFIED',
      name: "Verified Trader",
      email: email,
      tier: 'BASIC',
      role: 'NONE',
      balance: 1000,
      mode: 'PAPER',
      status: 'ACTIVE'
    } as Partial<UserProfile>
  };
};

export const resetPasswordRequest = async (email: string) => {
  await new Promise(resolve => setTimeout(resolve, 1200));
  return { success: true, message: "Recovery link synchronized with your neural link (email)." };
};
