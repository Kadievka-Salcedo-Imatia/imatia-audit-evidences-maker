import ResponseError from './IResponseError';

export default interface IResponse {
    statusCode: number;
    message?: string;
    data?: Record<string, any>;
    error?: ResponseError;
}
