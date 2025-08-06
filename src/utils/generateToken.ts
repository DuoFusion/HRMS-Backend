import jwt from 'jsonwebtoken';
import { config } from '../../config';

interface TokenPayload {
    userId: string;
    role: string;
}

// Generate JWT token
export const generateToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.JWT_TOKEN_SECRET, { expiresIn: '24h' });
};

// Generate refresh token
export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, config.REFRESH_JWT_TOKEN_SECRET, { expiresIn: '7d' });
};

// Verify JWT token
export const verifyToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, config.JWT_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};

// Verify refresh token
export const verifyRefreshToken = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, config.REFRESH_JWT_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
        return null;
    }
};

// Decode token without verification (for debugging)
export const decodeToken = (token: string): any => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
}; 