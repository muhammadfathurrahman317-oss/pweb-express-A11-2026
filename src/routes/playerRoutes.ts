import { Router } from 'express';
import {
  createPlayer,
  getPlayerDetail,
  updatePlayer,
  deletePlayer,
  topupDiamond,
  matchResult,
  buyHero,
} from '../controllers/playerController';

const router = Router();

router.post('/', createPlayer);
router.get('/:player_id', getPlayerDetail);
router.patch('/:player_id', updatePlayer);
router.delete('/:player_id', deletePlayer);

router.post('/:player_id/topup', topupDiamond);
router.post('/:player_id/matches', matchResult);
router.post('/:player_id/heroes', buyHero);

export default router;
