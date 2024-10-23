import Joi from "joi";
import Extension from "@joi/date";
import getLogger from "../../utils/logger";

const log = getLogger('getUserIssuesValidator');

Joi.extend(Extension);

export default function getUserIssuesValidator(reqBody: any): {
    validatorFailed: boolean;
    message: string;
} {
    const schema = Joi.object({
        username: Joi.string().regex(/^[a-zA-Z]+(\.[a-zA-Z]+)+$/).required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
    });

    log.debug('reqBody: ', reqBody);

    const { error } = schema.validate(reqBody);

    return {
        validatorFailed: Boolean(error),
        message: error ? error.message : 'validation passed',
    };
}
