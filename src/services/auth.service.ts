import bcrypt from 'bcrypt';

import { BadRequestError, UnauthorizedError } from '../core/error.response';
import UserModel, { Role } from '../models/user.model';
import { RegisterDto, LoginDto } from '../dtos/auth.dto';
import KeyTokenModel from '../models/keytoken.model';
import { generateKeyPair, createTokenPair, verifyJWT } from '../utils/auth/auth-util';

class AuthService {
    static signup = async ({ username, email, password }: RegisterDto) => {
        const holderUser = await UserModel.findOne({ email }).lean();
        if (holderUser) {
            throw new BadRequestError('Error: User already registered!');
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = await UserModel.create({
            username,
            email,
            password: passwordHash,
            roles: [Role.USER],
        });

        if (newUser) {
            return {
                user: {
                    _id: newUser._id,
                    username: newUser.username,
                    email: newUser.email,
                    roles: newUser.roles,
                },
            };
        }

        return {
            code: 200,
            data: null,
        };
    };

    static login = async ({ email, password }: LoginDto) => {
        const user = await UserModel.findOne({ email });
        if (!user) {
            throw new BadRequestError('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestError('Invalid email or password');
        }
        const { publicKey, privateKey } = generateKeyPair();

        const payload = {
            userId: user._id.toString(),
            email: user.email,
            roles: user.roles,
        };

        const tokens = await createTokenPair({ payload, privateKey });
        if (!tokens) {
            throw new Error('Failed to create tokens');
        }
        await KeyTokenModel.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                publicKey,
                privateKey,
                refreshToken: tokens.refreshToken,
                refreshTokensUsed: [],
            },
            { upsert: true, new: true },
        );

        return {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                roles: user.roles,
            },
            tokens: {
                accessToken: tokens.accessToken,
                refreshToken: tokens.refreshToken,
            },
        };
    };

    static refreshToken = async (refreshToken: string) => {
        const foundUsedToken = await KeyTokenModel.findOne({
            refreshTokensUsed: refreshToken,
        });

        if (foundUsedToken) {
            await KeyTokenModel.deleteOne({ userId: foundUsedToken.userId });
            throw new UnauthorizedError('All sessions invalidated.');
        }

        const keyToken = await KeyTokenModel.findOne({ refreshToken });
        if (!keyToken) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        try {
            const decoded = (await verifyJWT({
                token: refreshToken,
                keySecret: keyToken.publicKey,
            })) as { userId: string; email: string; roles: string[] };

            const user = await UserModel.findById(decoded.userId);
            if (!user) {
                throw new UnauthorizedError('User not found');
            }

            const { publicKey, privateKey } = generateKeyPair();

            const payload = {
                userId: user._id.toString(),
                email: user.email,
                roles: user.roles,
            };

            const tokens = await createTokenPair({ payload, privateKey });
            if (!tokens) {
                throw new Error('Failed to create tokens');
            }

            await KeyTokenModel.findByIdAndUpdate(keyToken._id, {
                publicKey,
                privateKey,
                refreshToken: tokens.refreshToken,
                $push: { refreshTokensUsed: refreshToken },
            });

            return {
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    roles: user.roles,
                },
                tokens: {
                    accessToken: tokens.accessToken,
                    refreshToken: tokens.refreshToken,
                },
            };
        } catch (error) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }
    };

    static logout = async (userId: string) => {
        const result = await KeyTokenModel.deleteOne({ userId });
        return result.deletedCount > 0;
    };
}

export default AuthService;
