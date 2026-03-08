import jwt from 'jsonwebtoken';
import crypto from 'crypto';

/**
 * Generate RSA key pair for JWT signing and verification
 * @returns Object containing publicKey and privateKey in PEM format
 */
export const generateKeyPair = (): { publicKey: string; privateKey: string } => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
        },
    });

    return { publicKey, privateKey };
};

/**
 * Create access token and refresh token pair
 * @param payload - Data to encode in the token
 * @param privateKey - RSA private key for signing
 * @returns Object containing accessToken and refreshToken
 */
export const createTokenPair = async ({
    payload,
    privateKey,
}: {
    payload: any;
    privateKey: string;
}): Promise<{ accessToken: string; refreshToken: string } | null> => {
    try {
        // Create access token (short-lived)
        const accessToken = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '2 days',
        });

        // Create refresh token (long-lived)
        const refreshToken = jwt.sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '7 days',
        });

        return { accessToken, refreshToken };
    } catch (error) {
        console.error('Error creating token pair:', error);
        return null;
    }
};

/**
 * Verify JWT token using public key
 * @param token - JWT token to verify
 * @param keySecret - Public key for verification
 * @returns Decoded token payload
 */
export const verifyJWT = async ({ token, keySecret }: { token: string; keySecret: string }) => {
    return jwt.verify(token, keySecret, { algorithms: ['RS256'] });
};
