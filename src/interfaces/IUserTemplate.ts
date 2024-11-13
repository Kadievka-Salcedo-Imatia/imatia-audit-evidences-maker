import { PageTypeEnum } from '../enums/PageTypeEnum';

export default interface IUserTemplate {
    username: string;
    path: string;
    downloadUrl?: string;
    createdAt: Date;
    updatedAt: Date;
    evidenceUserDisplayName: string;
    pageType?: PageTypeEnum;
    year: number;
    month: string;
}
