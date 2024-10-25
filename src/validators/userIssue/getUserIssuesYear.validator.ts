import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getUserIssuesYearValidator');

export default function getUserIssuesYearValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = Joi.object({
        username: Joi.string()
            .regex(/^[a-zA-Z]+(\.[a-zA-Z]+)+$/)
            .required(),
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
