import { Router } from 'express';
import { getAllSkins, getSkinDetail } from '../controllers/skinController';

const router = Router();

router.get('/', getAllSkins);
router.get('/:skin_id', getSkinDetail);

export default router;
