export default interface IGetDownloadLinksInput {
    header: {
        getCredentials: string[];
        authorization: string;
    };
    pageType?: string;
    year?: number;
    offset?: number;
    limit?: number;
}
