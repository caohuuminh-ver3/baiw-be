import express from 'express';

import auth from './auth';
import chat from './chat';
import product from './product';
import recommendation from './recommendation';

const router = express.Router();

router.use('/v1/api/', auth);
router.use('/v1/api/', chat);
router.use('/v1/api/', product);
router.use('/v1/api/', recommendation);

router.get('/health', (req, res) => {
	res.json({ message: 'OK' });
});

export default router;
