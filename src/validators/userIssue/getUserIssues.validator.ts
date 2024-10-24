import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getUserIssuesValidator');

export default function getUserIssuesValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = Joi.object({
        username: Joi.string()
            .regex(/^[a-zA-Z]+(\.[a-zA-Z]+)+$/)
            .required(),
        year: Joi.number().positive().required(),
        month: Joi.number().min(1).max(12).required(),
    });

    log.info('reqBody: ', reqBody, !isNaN(reqBody.year));

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
