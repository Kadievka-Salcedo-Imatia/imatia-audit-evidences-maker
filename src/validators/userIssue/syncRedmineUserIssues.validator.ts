import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('syncRedmineUserIssues');

export default function syncRedmineUserIssues(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = Joi.object({
        redmine_id: Joi.number().optional(),

        status_id: Joi.string().optional(),
        limit: Joi.number().positive().optional(),
        offset: Joi.number().optional(),
    });

    log.info('reqBody: ', reqBody, !isNaN(reqBody.year));

    const { error } = schema.validate(reqBody);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
