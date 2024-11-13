import mongoose, { Schema } from 'mongoose';
import IUserTemplate from '../interfaces/IUserTemplate';
import { PageTypeEnum } from '../enums/PageTypeEnum';

export const mongooseModel = mongoose.model(
    'user_templates',
    new Schema({
        username: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        createdAt: {
            type: Date,
        },
        updatedAt: {
            type: Date,
        },
        evidenceUserDisplayName: {
            type: String,
        },
        pageType: {
            type: String,
        },
        year: {
            type: Number,
        },
        month: {
            type: String,
        },
    }),
);

export default class UserTemplateModel {
    public username: string;
    public path: string;
    public createdAt: Date;
    public updatedAt: Date;
    public evidenceUserDisplayName: string;
    public pageType?: PageTypeEnum;
    public year: number;
    public month: string;

    constructor(userTemplate: IUserTemplate) {
        this.username = userTemplate.username;
        this.path = userTemplate.path;
        this.createdAt = userTemplate.createdAt;
        this.updatedAt = userTemplate.updatedAt;
        this.evidenceUserDisplayName = userTemplate.evidenceUserDisplayName;
        this.pageType = userTemplate.pageType;
        this.year = userTemplate.year;
        this.month = userTemplate.month;
    }

    /**
     * Map users fields for database
     * @returns {Record<string, any>}
     */
    public getProperties(): IUserTemplate {
        return {
            username: this.username,
            path: this.path,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            evidenceUserDisplayName: this.evidenceUserDisplayName,
            pageType: this.pageType,
            year: this.year,
            month: this.month,
        };
    }
}
