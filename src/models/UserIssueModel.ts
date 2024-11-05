import mongoose, { Schema } from 'mongoose';
import { PageTypeEnum } from '../enums/PageTypeEnum';
import IUserIssue from '../interfaces/IUserIssue';

const mongooseModel = mongoose.model(
    'user_issues',
    new Schema({
        id: {
            type: String,
            unique: true,
            required: true,
        },
        key: String,
        type: String,
        created: Date,
        updated: Date,
        closed: Date,
        assignee: String,
        assignedToId: String,
        status: String,
        description: String,
        summary: String,
        project: String,
        projectTypeKey: String,
        self: String,
        creator: String,
        reporter: String,
        pageType: String,
    }),
);

export default class UserIssueModel {

    /**
     * Returns the mongoose model that is basically a MongoDB document
     * @returns {mongoose.Model<any>}
     */
    public static getMongooseModel(): mongoose.Model<any> {
        return mongooseModel;
    }

    public id: string;
    public key: string;
    public type: string;
    public created: Date;
    public updated: Date;
    public closed?: Date;
    public assignee: string;
    public assignedToId: string;
    public status: string;
    public description: string;
    public summary: string;
    public project: string;
    public projectTypeKey: string;
    public self: string;
    public creator: string;
    public reporter: string;
    public pageType: PageTypeEnum;

    constructor(userIssue: IUserIssue) {
        this.id = userIssue.id;
        this.key = userIssue.key;
        this.type = userIssue.type;
        this.created = new Date(userIssue.created);
        this.updated = new Date(userIssue.updated);
        this.closed = userIssue.closed ? new Date(userIssue.closed) : undefined;
        this.assignee = userIssue.assignee;
        this.assignedToId = userIssue.assignedToId;
        this.status = userIssue.status;
        this.description = userIssue.description;
        this.summary = userIssue.summary;
        this.project = userIssue.project;
        this.projectTypeKey = userIssue.projectTypeKey;
        this.self = userIssue.self;
        this.creator = userIssue.creator;
        this.reporter = userIssue.reporter;
        this.pageType = userIssue.pageType;
    }

    /**
     * Map user issues's fields for database
     * @returns {IUserIssue} IUserIssue Interface object
     */
    public getProperties(): Record<string, any> {
        return {
            id: this.id,
            key: this.key,
            type: this.type,
            created: this.created,
            updated: this.updated,
            closed: this.closed,
            assignee: this.assignee,
            assignedToId: this.assignedToId,
            status: this.status,
            description: this.description,
            summary: this.summary,
            project: this.project,
            projectTypeKey: this.projectTypeKey,
            self: this.self,
            creator: this.creator,
            reporter: this.reporter,
            pageType: this.pageType,
        };
    }

}
