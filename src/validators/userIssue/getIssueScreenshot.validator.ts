import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getIssueScreenshotValidator.validator.ts');

export default function getIssueScreenshotValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = {
        page_type: Joi.string().required(),
        link: Joi.string().required(),
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
