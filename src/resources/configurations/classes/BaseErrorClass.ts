import IBaseError from '../../../interfaces/configurations/IBaseError';
import IResponseStatus from '../../../interfaces/configurations/IResponseStatus';

export default class BaseErrorClass extends Error implements IBaseError {
    public code: number;
    public message: string;
    public error?: any;
    public responseStatus: IResponseStatus;

    constructor(baseError: IBaseError) {
        super();
        this.code = baseError.code;
        this.message = baseError.message;
        this.error = baseError.error;
        this.responseStatus = baseError.responseStatus;
    }
}
