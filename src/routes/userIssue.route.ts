import express from 'express';
import UserIssueController from '../controllers/userIssue.controller';
import ResponseStatus from '../resources/configurations/constants/ResponseStatusCodes';
import ResponseClass from '../resources/configurations/classes/ResponseClass';
import getUserIssuesValidator from '../validators/userIssue/getUserIssues.validator';

const router = express.Router();

const userIssueController: UserIssueController = UserIssueController.getInstance();

const response: ResponseClass = new ResponseClass(userIssueController);

router.post('/schema', (req, res) => {
    const { validatorFailed, message } = getUserIssuesValidator(req.body);
    validatorFailed ? response.sendBadRequest(res, message) : response.send(req, res, ResponseStatus.OK, 'getUserIssues');
});

router.post('/description', (req, res) => {
    const { validatorFailed, message } = getUserIssuesValidator(req.body);
    validatorFailed ? response.sendBadRequest(res, message) : response.send(req, res, ResponseStatus.OK, 'getUserIssuesDescriptions');
});

export default router;
