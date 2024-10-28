import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getUserIssuesYearValidator');

export default function getUserIssuesYearValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = Joi.object({
        jira_username: Joi.string()
            .regex(/^[a-zA-Z]+(\.[a-zA-Z]+)+$/)
            .optional(),
        redmine_id: Joi.number().positive().optional(),
        year: Joi.number().positive().required(),
    });

    log.info('reqBody: ', reqBody, !isNaN(reqBody.year));

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
