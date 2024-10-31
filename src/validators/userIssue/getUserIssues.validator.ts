import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getUserIssues.validator.ts');

export default function getUserIssuesValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = Joi.object({
        jira_username: Joi.string().optional(),
        redmine_id: Joi.number().positive().optional(),
        year: Joi.number().positive().required(),
        month: Joi.number().min(1).max(12).required(),
        rewrite_files: Joi.boolean().optional(),
        jira_url: Joi.string().uri().optional(),
    });

    log.info('reqBody:', reqBody);

    if (typeof reqBody.year !== 'number') {
        return {
            validatorFailed: true,
            message: 'year must be a positive number',
        };
    }

    if (typeof reqBody.month !== 'number') {
        return {
            validatorFailed: true,
            message: 'month must be a number between 1 and 12',
        };
    }

    const { error } = schema.validate(reqBody);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
