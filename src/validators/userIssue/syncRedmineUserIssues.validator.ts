import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('syncRedmineUserIssues.validator.ts');

export default function syncRedmineUserIssues(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = {
        status_id: Joi.string().optional(),
        limit: Joi.number().positive().optional(),
        offset: Joi.number().optional(),
    };

    log.info('reqBody: ', reqBody);

    if (reqBody) {
        for (const key in reqBody) {
            if (!(key in schema)) {
                return {
                    validatorFailed: true,
                    message: `the property "${key}" is invalid. Please removed it.`,
                };
            }
        }
    }

    const { error } = Joi.object(schema).validate(reqBody);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
