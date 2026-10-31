import { Router } from 'express';
import {
  getAllHeroes,
  getHeroDetail,
  createHero,
} from '../controllers/heroController';

const router = Router();

router.get('/', getAllHeroes);
router.get('/:hero_id', getHeroDetail);
router.post('/', createHero);

export default router;
