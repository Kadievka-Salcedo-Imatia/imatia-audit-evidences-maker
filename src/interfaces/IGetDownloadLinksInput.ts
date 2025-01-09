import IHeader from './IHeader';

export default interface IGetDownloadLinksInput extends IHeader {
    pageType?: string;
    year?: number;
    offset?: number;
    limit?: number;
}
