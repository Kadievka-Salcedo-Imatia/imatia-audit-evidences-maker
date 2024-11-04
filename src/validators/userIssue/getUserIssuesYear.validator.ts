import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getUserIssuesYear.validator.ts');

export default function getUserIssuesYearValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = Joi.object({
        jira_username: Joi.string().optional(),
        redmine_id: Joi.number().positive().optional(),
        year: Joi.number().positive().required(),
        rewrite_files: Joi.boolean().optional(),
        jira_base_url: Joi.string().uri().optional(),
        jira_url: Joi.string().uri().optional(),
        jql: Joi.string().uri().optional(),
    });

    log.info('reqBody: ', reqBody);

    if (typeof reqBody.year !== 'number') {
        return {
            validatorFailed: true,
            message: 'year must be a positive number',
        };
    }

    const { error } = schema.validate(reqBody);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
