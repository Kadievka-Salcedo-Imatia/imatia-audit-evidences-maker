import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getUserIssuesYear.validator.ts');

export default function getUserIssuesYearValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = {
        jira_username: Joi.string().optional(),
        redmine_id: Joi.number().positive().optional(),
        year: Joi.number().positive().required(),
        rewrite_files: Joi.boolean().optional(),
        jira_base_url: Joi.string().uri().optional(),
        jira_url: Joi.string().optional(),
        jql: Joi.string().optional(),
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

    if (!reqBody.year) {
        return {
            validatorFailed: true,
            message: 'property "year" is required. Please specify a valid year.',
        };
    }

    if (typeof reqBody.year !== 'number') {
        return {
            validatorFailed: true,
            message: 'property "year" must be a positive number',
        };
    }

    const { error } = Joi.object(schema).validate(reqBody);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
