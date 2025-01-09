import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getUserIssueDetails.validator.ts');

export default function getUserIssueDetailsValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = {
        jira_username: Joi.string().optional(),
        redmine_id: Joi.number().positive().optional(),
        issue_id: Joi.string().required(),
    };

    log.info('reqBody:', reqBody);

    if (!reqBody || Object.keys(reqBody).length === 0) {
        return {
            validatorFailed: true,
            message: 'request body can not be empty',
        };
    }

    for (const key in reqBody) {
        if (!(key in schema)) {
            return {
                validatorFailed: true,
                message: `the property "${key}" is invalid. Please removed it.`,
            };
        }
    }

    const { error } = Joi.object(schema).validate(reqBody);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
