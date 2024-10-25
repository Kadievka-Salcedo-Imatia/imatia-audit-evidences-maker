import express from 'express';
import UserIssueController from '../controllers/userIssue.controller';
import ResponseStatus from '../resources/configurations/constants/ResponseStatusCodes';
import ResponseClass from '../resources/configurations/classes/ResponseClass';
import getUserIssuesValidator from '../validators/userIssue/getUserIssues.validator';
import getUserIssuesYearValidator from '../validators/userIssue/getUserIssuesYear.validator';

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

router.post('/create-template', (req, res) => {
    const { validatorFailed, message } = getUserIssuesValidator(req.body);
    validatorFailed ? response.sendBadRequest(res, message) : response.send(req, res, ResponseStatus.OK, 'createTemplate');
});

router.post('/create-template-from-year', (req, res) => {
    const { validatorFailed, message } = getUserIssuesYearValidator(req.body);
    validatorFailed ? response.sendBadRequest(res, message) : response.send(req, res, ResponseStatus.OK, 'createTemplatesYear');
});

export default router;
