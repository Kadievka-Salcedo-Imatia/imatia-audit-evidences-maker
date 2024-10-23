import express from 'express';
import MainController from '../controllers/main.controller';
import ResponseStatus from '../resources/configurations/constants/ResponseStatusCodes';
import ResponseClass from '../resources/configurations/classes/ResponseClass';

const router = express.Router();

const mainController: MainController = MainController.getInstance();

const response: ResponseClass = new ResponseClass(mainController);

router.get('/', (req, res) => {
    response.send(req, res, ResponseStatus.OK, 'sendWelcome');
});

export default router;
