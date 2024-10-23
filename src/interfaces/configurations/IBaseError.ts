import IResponseStatus from './IResponseStatus';

export default interface IBaseError {
    code: number;
    message: string;
    responseStatus: IResponseStatus;
}
