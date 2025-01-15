import { PageTypeEnum } from '../enums/PageTypeEnum';
import IHeader from './IHeader';

export default interface IGetScreenshotInput extends IHeader {
    link: string;
    pageType: PageTypeEnum | string;
}
