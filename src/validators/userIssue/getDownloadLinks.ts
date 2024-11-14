import Joi from 'joi';
import getLogger from '../../utils/logger';

const log = getLogger('getDownloadLinks.validator.ts');

export default function getDownloadLinks(reqQuery: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = {
        pageType: Joi.string().optional(),
        year: Joi.number().positive().optional(),
        offset: Joi.number().optional(),
        limit: Joi.number().positive().optional(),
    };

    log.info('reqQuery:', reqQuery);

    for (const key in reqQuery) {
        if (!(key in schema)) {
            return {
                validatorFailed: true,
                message: `the property "${key}" is invalid. Please removed it.`,
            };
        }
    }

    const { error } = Joi.object(schema).validate(reqQuery);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
