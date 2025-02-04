import { Document, ExternalHyperlink, FileChild, ImageRun, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import fs from 'fs';
import path from 'path';
import getLogger from '../utils/logger';
import IUserIssuesInput from '../interfaces/IUserIssuesInput';
import IDataIssue from '../interfaces/IDataIssue';
import IUserIssue from '../interfaces/IUserIssue';
import { MONTHS } from '../resources/configurations/constants/Months';
import IIssueDescription from '../interfaces/IIssueDescription';
import IEvidence from '../interfaces/IEvidence';
import { formatDateTime } from '../utils/dates';
import puppeteer, { Browser } from 'puppeteer';
import ICreateTemplateYearOutput from '../interfaces/ICreateTemplateYearOutput';
import JiraService from './jira.service';
import RedmineService from './redmine.service';
import { PageTypeEnum } from '../enums/PageTypeEnum';
import IGetIssueFromRedmineInput from '../interfaces/IGetIssueFromRedmineInput';
import UserIssueModel, { mongooseModel } from '../models/UserIssueModel';
import { getPagesNumber } from '../utils/pagination';
import ISyncRedmineUserIssuesOutput from '../interfaces/ISyncRedmineUserIssuesOutput';
import ICreateTemplateInput from '../interfaces/ICreateTemplateInput';
import IDateTime from '../interfaces/IDateTime';
import UserTemplateService from './userTemplate.service';
import IUserTemplate from '../interfaces/IUserTemplate';
import IGetDownloadLinksInput from '../interfaces/IGetDownloadLinksInput';
import IGetDownloadLinksOutput from '../interfaces/IGetDownloadLinksOutput';
import BaseErrorClass from '../resources/configurations/classes/BaseErrorClass';
import INTERNAL_ERROR_CODES from '../resources/configurations/constants/InternalErrorCodes';
import IDownloadOutput from '../interfaces/IDownloadOutput';
import IUserIssueDetailInput from '../interfaces/IUserIssueDetailInput';
import IUserIssueDetail from '../interfaces/IUserIssueDetail';
import RESPONSE_STATUS_CODES from '../resources/configurations/constants/ResponseStatusCodes';
import IIssueInfoToTakeScreenshot from '../interfaces/IIssueInfoToTakeScreenshot';
import IGetScreenshotInput from '../interfaces/IGetScreenshotInput';

const log = getLogger('userIssue.service.ts');

const jiraService: JiraService = JiraService.getInstance();
const redmineService: RedmineService = RedmineService.getInstance();
const userTemplateService: UserTemplateService = UserTemplateService.getInstance();

export default class UserIssueService {
    public static instance: UserIssueService;

    /**
     * Returns the single instance of UserIssueService.
     * @returns {UserIssueService} Singleton instance
     */
    public static getInstance(): UserIssueService {
        if (!this.instance) {
            this.instance = new UserIssueService();
        }
        return this.instance;
    }

    /**
     * Maps data from jira and returns the user issues as standard user issues array
     * @param {Array<Record<string, any>>} issues jira array of issues
     * @param {string | undefined} jiraBaseUrl if there's a external jira url
     * @returns {IUserIssue[]} array of user issues
     */
    public static mapIssuesFromJira(issues: Array<Record<string, any>>, jiraBaseUrl?: string): IUserIssue[] {
        return issues.map((issue: Record<string, any>) => this.transcribeJiraIssueToUserIssue(issue, jiraBaseUrl));
    }

    /**
     * Maps data from a single jira issue and returns user issues standard
     * @param {Record<string, any>} issue jira issue
     * @param {string | undefined} jiraBaseUrl if there's a external jira url
     * @returns {IUserIssue} user issue structure
     */
    public static transcribeJiraIssueToUserIssue(issue: Record<string, any>, jiraBaseUrl?: string): IUserIssue {
        return {
            id: issue.id,
            key: issue.key,
            self: Boolean(jiraBaseUrl) ? jiraBaseUrl + '/browse/' + issue.key : process.env.JIRA_CLOUD_URL! + '/browse/' + issue.key,
            type: issue.fields.issuetype.name,
            created: issue.fields.created,
            updated: issue.fields.updated,
            assignee: issue.fields.assignee?.displayName || '',
            status: issue.fields.status.name,
            description: issue.fields.description,
            summary: issue.fields.summary,
            project: issue.fields.project.name,
            projectTypeKey: issue.fields.project.projectTypeKey,
            pageType: PageTypeEnum.JIRA,
        };
    }

    /**
     * This method returns a issue summary to show inside the document template
     * @param {IUserIssue} issue - the user issue
     * @returns {string} summary
     */
    public static getIssueSummary(issue: IUserIssue): string {
        const description = UserIssueService.getIssueShortDescription(issue.description);

        const createdDateTime: IDateTime = formatDateTime(issue.created);

        const updatedDateTime: IDateTime = formatDateTime(issue.updated);

        if (issue.pageType === PageTypeEnum.JIRA) {
            return `${issue.summary} del proyecto ${issue.project}. Se trataba de ${description}. Esta tarea fue creada el día ${createdDateTime.date} a las ${createdDateTime.time} y su ultima actualización fue el día ${updatedDateTime.date} a las ${updatedDateTime.time} con status ${issue.status}. En el siguiente enlace se puede consultar más a detalle esta tarea: `;
        }
        return `${issue.summary} del proyecto ${issue.project}. Se trataba de ${description}. Esta tarea fue creada el día ${createdDateTime.date} a las ${createdDateTime.time} y su status fue ${issue.status} el día ${updatedDateTime.date} a las ${updatedDateTime.time}. En el siguiente enlace se puede consultar más a detalle esta tarea: `;
    }

    /**
     * This method returns the description shorter if it finds a dot in the description, avoids descriptions too long with irrelevant information
     * @param {string} description - the user issue description
     * @returns {string} shorter description
     */
    public static getIssueShortDescription(description: string): string {
        return description ? description.split('.')[0].trim() : description;
    }

    // env vars
    private readonly REDMINE_BASE_URL: string = process.env.REDMINE_BASE_URL!;
    private readonly PROTOCOL_URL: string = process.env.PROTOCOL_URL!;
    private readonly BASE_URL: string = process.env.BASE_URL!;
    private readonly PORT: string = process.env.PORT!;

    // Document Template styles
    private readonly FONT: string = 'Segoe UI';
    private readonly SIZE: number = 20;
    private readonly TABLE_WIDTH = {
        size: 100,
        type: WidthType.PERCENTAGE,
    };
    private readonly IMAGE_SIZE = {
        width: 600,
        height: 500,
    };
    private readonly IMAGE_SIZE_LAST_REDMINE_IMAGE = {
        width: 600,
        height: 800,
    };

    // Puppeteer
    private readonly PUPPETEER_LAUNCH_OPTIONS = {
        headless: false, // to display the browser: { headless: false }
    };
    private readonly VIEWPORT_SIZE = {
        width: 1600,
        height: 1400,
    };

    /**
     * Creates or updates by id an user issue in MongoDB.
     * @param {Record<string, any>} redmineIssue User issue data from redmine endpoint
     * @returns {Promise<IUserIssue>} IUserIssue
     */
    public async createUserIssue(redmineIssue: Record<string, any>): Promise<Record<string, any>> {
        log.info('  Start UserIssueService@createUserIssue method');

        const userIssueModel: UserIssueModel = new UserIssueModel({
            id: redmineIssue.id,
            key: redmineIssue.id,
            self: `${this.REDMINE_BASE_URL}/issues/${redmineIssue.id}`,
            type: redmineIssue.tracker.name,
            created: redmineIssue.created_on,
            updated: redmineIssue.updated_on,
            closed: redmineIssue.closed_on,
            assignee: redmineIssue.assigned_to?.name || '',
            assignedToId: redmineIssue.assigned_to?.id || '',
            status: redmineIssue.status.name,
            description: redmineIssue.subject,
            summary: redmineIssue.description,
            project: redmineIssue.project.name,
            projectTypeKey: redmineIssue.project.id,
            creator: redmineIssue.author.name,
            reporter: redmineIssue.author.name,
            pageType: PageTypeEnum.REDMINE,
        });

        try {
            const dbRegister: any = await mongooseModel.findOne({ id: userIssueModel.id });
            if (dbRegister) {
                await dbRegister.save(userIssueModel.getProperties());
                log.info('   UserIssueService@createUserIssue updated', redmineIssue.id);
            } else {
                await mongooseModel.create(userIssueModel.getProperties());
                log.info('   UserIssueService@createUserIssue created', redmineIssue.id);
            }
        } catch (error) {
            log.error('   Error UserIssueService@createUserIssue method', error);
            throw error;
        }

        log.info('  Finish UserIssueService@createUserIssue method');
        return userIssueModel.getProperties();
    }

    /**
     * Method to map redmine user issues data and save them to the database
     * @param {IUserIssuesInput} request - request body
     * @returns {Promise<Record<string, any>>} Async user issues as schema
     */
    public async getIssuesFromRedmineAndSave(request: IGetIssueFromRedmineInput): Promise<Record<string, any>> {
        log.info(' Start UserIssueService@getAndSaveIssues method');
        const data = await redmineService.getUserIssues(request);

        let createdRegisters: number = 0;

        for (const issue of data.issues) {
            try {
                await this.createUserIssue(issue);
                createdRegisters++;
            } catch (error) {
                log.error(' Error UserIssueService@getIssuesFromRedmineAndSave method', error);
            }
        }

        log.info(' Finish UserIssueService@getAndSaveIssues method');
        return { ...data, createdRegisters };
    }

    /**
     * Method to map all issues in redmine using the pagination
     * @param {IUserIssuesInput} request - request body with redmine_id
     * @returns {Promise<Record<string, any>>} Async user issues as schema
     */
    public async syncRedmineUserIssues(request: IGetIssueFromRedmineInput): Promise<ISyncRedmineUserIssuesOutput> {
        log.info('Start UserIssueService@mapUserIssuesAndSaveInDB method');

        let createdRegisters = 0;

        const startTime = performance.now();

        let response = await this.getIssuesFromRedmineAndSave(request);
        createdRegisters = response.createdRegisters;

        let offset: number = request.offset || 0;

        const iterations: number = getPagesNumber(response.total_count, response.limit);

        log.info(' UserIssueService@mapUserIssuesAndSaveInDB iterations:', iterations);

        for (let index = 1; index < iterations; index++) {
            offset += response.limit;
            response = await this.getIssuesFromRedmineAndSave({ ...request, offset });
            createdRegisters += response.createdRegisters;
        }

        const endTime = performance.now();

        const time = `${endTime - startTime} ms`;

        log.info(`Finish UserIssueService@mapUserIssuesAndSaveInDB method in: ${endTime - startTime} ms`);

        return {
            createdRegisters,
            time,
        };
    }

    /**
     * Gets user issues by redmine id from MongoDB.
     * @param {number} assignedToId The user redmine_id
     * @param {Date} startDate
     * @param {Date} endDate
     * @returns {Promise<FindCursor>} user issues information comes from the database
     */
    public async getDbUserIssues(assignedToId: number, startDate: Date, endDate: Date): Promise<any> {
        log.info('  Start UserIssueService@getDbUserIssues method with params:', { assignedToId, startDate, endDate });
        let dbUserIssues;

        try {
            dbUserIssues = await mongooseModel
                .find({
                    assignedToId,
                    $or: [{ updated: { $gte: startDate, $lte: endDate } }, { closed: { $gte: startDate, $lte: endDate } }],
                })
                .sort({ updated: -1, closed: -1 });
        } catch (error) {
            log.error('  Error UserIssueService@createUserIssue method', error);
            throw error;
        }

        log.info('  Finish UserIssueService@getDbUserIssues method');
        return dbUserIssues;
    }

    /**
     * Gets user issue redmine by issue_id from MongoDB.
     * @param {number} assignedToId The user redmine_id
     * @param {string} id issue id internal redmine id
     * @returns {Promise<FindCursor>} user issues information comes from the database
     */
    public async getDbRedmineUserIssueById(id: string): Promise<any> {
        log.info('  Start UserIssueService@getDbRedmineUserIssueById method with params:', { id });
        let dbUserIssue;

        try {
            dbUserIssue = await mongooseModel.findOne({
                id,
            });
        } catch (error) {
            log.error('  Error UserIssueService@getDbRedmineUserIssueById method', error);
            throw error;
        }

        log.info('  Finish UserIssueService@getDbRedmineUserIssueById method');
        return dbUserIssue;
    }

    /**
     * Returns the user issues as schema
     * @param {IUserIssuesInput} request - request body with jira_username, redmine_id, startDate and endDate
     * @returns {Promise<IDataIssue>} Async user issues as schema
     */
    public async getUserIssues(request: IUserIssuesInput): Promise<IDataIssue> {
        log.info('  Start UserIssueService@getUserIssues method with params:', {
            jira_username: request.jira_username,
            redmine_id: request.redmine_id,
            year: request.year,
            month: request.month,
        });

        const startDate: string = `${request.year}-${request.month}-01`;
        const endDate: string = `${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}`;

        let data: Record<string, any> = {};

        const userIssue: IDataIssue = {
            month: MONTHS()[request.month - 1].displayName,
            total: 0,
            userDisplayName: '',
            project: '',
            issues: [],
        };

        if (request.jira_username) {
            data = await jiraService.getUserIssues({
                authorization: request.header.authorization,
                jira_base_url: request.jira_base_url,
                jira_url: request.jira_url,
                jql: request.jql,
                jira_username: request.jira_username,
                startDate,
                endDate,
            });

            userIssue.total = data.total;
            userIssue.issues = UserIssueService.mapIssuesFromJira(data.issues, request.jira_base_url);
            userIssue.userDisplayName = userIssue.issues[0]?.assignee || '';
            userIssue.project = userIssue.issues[0]?.project;
        }

        if (request.redmine_id) {
            data = await this.getDbUserIssues(request.redmine_id, new Date(startDate), new Date(endDate));

            if (data.length > 0) {
                userIssue.total += data.length;
                userIssue.userDisplayName = userIssue.userDisplayName ? userIssue.userDisplayName : data[0].assignee;
                userIssue.project = userIssue.project ? userIssue.project : data[0].project;

                data.forEach((element: IUserIssue) => {
                    userIssue.issues.push(element);
                });
            }
        }

        log.info('  Finish UserIssueService@getUserIssues method');
        return userIssue;
    }

    /**
     * Returns the user issue detail with screenshot as schema
     * @param {IUserIssueDetailInput} request - request body with page_type and issue_id
     * @returns {Promise<IUserIssueDetail>} Async user issue detail with screenshot as schema
     */
    public async getUserIssueDetail(request: IUserIssueDetailInput): Promise<IUserIssueDetail> {
        log.info('  Start UserIssueService@getUserIssueDetail method with params:', {
            username: request.header.getCredentials[0],
            page_type: request.page_type,
            issue_id: request.issue_id,
        });

        let data: any = {};

        let userIssue: IUserIssue = {
            id: '',
            key: '',
            type: '',
            created: '',
            updated: '',
            assignee: '',
            assignedToId: '',
            status: '',
            description: '',
            summary: '',
            project: '',
            projectTypeKey: '',
            self: '',
            creator: '',
            reporter: '',
            pageType: PageTypeEnum.JIRA,
        };

        if (request.page_type === PageTypeEnum.JIRA) {
            try {
                data = await jiraService.getUserIssueDetailById({
                    authorization: request.header.authorization,
                    issue_id: request.issue_id,
                });
            } catch (error: any) {
                log.error('Error UserIssueService@getUserIssueDetail on "data = await jiraService.getUserIssues"', error);

                if (error.name === 'AxiosError') {
                    throw new BaseErrorClass({
                        responseStatus: {
                            statusCode: error.status,
                            message: error.message,
                        },
                        code: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.code,
                        message: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.message,
                        error: {
                            code: error.code,
                            config: {
                                baseURL: error.config.baseURL,
                                params: error.config.params,
                                method: error.config.method,
                                url: error.config.url,
                            },
                        },
                    });
                }

                throw new BaseErrorClass({
                    responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
                    code: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.code,
                    message: INTERNAL_ERROR_CODES.JIRA_ISSUE_NOT_FOUND.message,
                });
            }

            userIssue = UserIssueService.transcribeJiraIssueToUserIssue(data);
        }

        if (request.page_type === PageTypeEnum.REDMINE) {
            try {
                data = await this.getDbRedmineUserIssueById(request.issue_id);
            } catch (error) {
                log.error('Error UserIssueService@getUserIssueDetail on "data = await this.getDbRedmineUserIssueById"', error);
                throw error;
            }

            if (!data) {
                throw new BaseErrorClass({
                    responseStatus: RESPONSE_STATUS_CODES.NOT_FOUND,
                    code: INTERNAL_ERROR_CODES.REDMINE_ISSUE_NOT_FOUND.code,
                    message: INTERNAL_ERROR_CODES.REDMINE_ISSUE_NOT_FOUND.message,
                });
            }

            userIssue = data;
        }

        const issueDescription: IIssueDescription = {
            title: `${userIssue.type} #${userIssue.key}: `,
            summary: UserIssueService.getIssueSummary(userIssue),
            link: userIssue.self,
            pageType: userIssue.pageType,
            closed: userIssue.closed!,
            project: userIssue.project,
        };

        const browser: Browser = await puppeteer.launch(this.PUPPETEER_LAUNCH_OPTIONS);

        const imageBase64Data = await this.takeScreenshot(issueDescription, browser, true, request.header.getCredentials);

        await browser.close();

        log.info('  Finish UserIssueService@getUserIssueDetail method');
        return {
            id: userIssue.id,
            key: userIssue.key,
            type: userIssue.type,
            created: userIssue.created,
            updated: userIssue.updated,
            assignee: userIssue.assignee,
            assignedToId: userIssue.assignedToId,
            status: userIssue.status,
            description: userIssue.description,
            summary: userIssue.summary,
            project: userIssue.project,
            projectTypeKey: userIssue.projectTypeKey,
            self: userIssue.self,
            creator: userIssue.creator,
            reporter: userIssue.reporter,
            pageType: userIssue.pageType,
            screenshot: imageBase64Data,
        };
    }

    /**
     * Returns the user issue screenshot Buffer
     * @param {IGetScreenshotInput} request - request body with pageType
     * @returns {Promise<IUserIssueDetail>} Async user issue screenshot buffer
     */
    public async getIssueScreenshot(request: IGetScreenshotInput): Promise<{ screenshot: Buffer }> {
        log.info('  Start UserIssueService@getIssueScreenshot method with params:', {
            username: request.header.getCredentials[0],
            page_type: request.pageType,
            issue_id: request.link,
        });

        const browser: Browser = await puppeteer.launch(this.PUPPETEER_LAUNCH_OPTIONS);

        const imageBase64Data = await this.takeScreenshot(request, browser, true, request.header.getCredentials);

        await browser.close();

        log.info('  Finish UserIssueService@getIssueScreenshot method');
        return {
            screenshot: imageBase64Data,
        };
    }

    /**
     * Maps the User Issues to create Evidence Description for the document
     * @param {IUserIssuesInput} request - the same request to get user issues
     * @returns {Promise<IEvidence>} Async promise to get Evidence description for the Word Template
     */
    public async getUserIssuesDescriptions(request: IUserIssuesInput): Promise<IEvidence> {
        log.info('Start UserIssueService@getUserIssuesDescriptions with jira_username:', request.jira_username);
        const userIssue: IDataIssue = await this.getUserIssues(request);

        const evidenceStart: string = `En el mes de ${userIssue.month} de ${request.year} se realizaron las siguientes tareas por ${userIssue.userDisplayName}: `;

        const issuesDescription: IIssueDescription[] = [];

        userIssue.issues.forEach((issue: IUserIssue) => {
            const title: string = `${issue.type} #${issue.key}: `;
            const summary: string = UserIssueService.getIssueSummary(issue);
            const link: string = issue.self;

            issuesDescription.push({
                title,
                summary,
                link,
                pageType: issue.pageType,
                closed: issue.closed!,
                project: issue.project,
            });
        });

        log.info('Finish UserIssueService@getUserIssuesDescriptions method');

        return {
            project: userIssue.project,
            userDisplayName: userIssue.userDisplayName,
            date: `${MONTHS(request.year)[request.month - 1].days}/${request.month}/${request.year}`,
            month: userIssue.month.toLocaleUpperCase(),
            evidenceStart,
            total: userIssue.total,
            issues: issuesDescription,
        };
    }

    /**
     * Creates Evidence Template Doc
     * @param {ICreateTemplateInput} request - the same request to get user issues
     * @returns {Promise<IEvidence>} Async promise to get Evidence description for the Word Template
     */
    public async createTemplate(request: ICreateTemplateInput): Promise<IEvidence> {
        log.info('Start UserIssueService@createTemplate with params:', { jira_username: request.jira_username, redmine_id: request.redmine_id });
        const startTime = performance.now();

        const evidence: IEvidence = await this.getUserIssuesDescriptions(request);

        if (!evidence.issues || evidence.issues.length === 0) {
            return evidence;
        }

        const pageType = this.getPageType(request);

        let newFilePath: string =
            __dirname + path.sep + '..' + path.sep + 'templates' + path.sep + 'EVIDENCIAS ' + request.year + path.sep + evidence.userDisplayName + path.sep + evidence.month;

        if (Boolean(pageType)) {
            newFilePath =
                __dirname +
                path.sep +
                '..' +
                path.sep +
                'templates' +
                path.sep +
                pageType +
                path.sep +
                'EVIDENCIAS ' +
                request.year +
                path.sep +
                evidence.userDisplayName +
                path.sep +
                evidence.month;
        }

        if (!fs.existsSync(newFilePath)) {
            fs.mkdirSync(newFilePath, { recursive: true });
        }

        const newFileName = newFilePath + path.sep + 'Plantilla Evidencias - ' + evidence.month.toLowerCase() + '.docx';

        if (fs.existsSync(newFileName)) {
            if (Boolean(request.rewrite_files)) {
                fs.rmSync(newFileName);
            } else {
                return { ...evidence, path: newFileName };
            }
        }

        let children: FileChild[] = this.buildTemplateTables(evidence);

        if (!Boolean(request.jira_base_url)) {
            // can not take screenshots of external jira boards because they could have custom authentication with phone number and other information
            const images: Paragraph[] = await this.splitIssuesByTypeAndGetImages(evidence, request);

            children = children.concat(images);
        }

        const doc = new Document({
            sections: [
                {
                    children,
                },
            ],
        });

        const newBuffer = await Packer.toBuffer(doc);
        fs.writeFileSync(newFileName, newBuffer);

        const [username] = request.header.getCredentials;
        const createTemplateInput: IUserTemplate = {
            username,
            path: newFileName,
            createdAt: new Date(),
            updatedAt: new Date(),
            evidenceUserDisplayName: evidence.userDisplayName,
            pageType: this.getPageType(request),
            year: request.year,
            month: evidence.month,
        };
        try {
            await userTemplateService.createUserTemplate(createTemplateInput);
        } catch (error) {
            log.error('Error UserIssueService@createTemplate creating the user template in DB', error);
        }

        const endTime = performance.now();
        log.info(`Finish UserIssueService@createTemplate path: ${newFileName} in time: ${endTime - startTime} ms:`);

        return { ...evidence, path: newFileName };
    }

    /**
     * Takes evidence array and builds the template tables with docx
     * @param {IEvidence} evidence - evidences array
     * @returns {FileChild[]} an array of tables and paragraphs
     */
    public buildTemplateTables(evidence: IEvidence): FileChild[] {
        const table1 = new Table({
            width: this.TABLE_WIDTH,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Proyecto:',
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            width: {
                                size: 90,
                                type: WidthType.PERCENTAGE,
                            },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: evidence.project,
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table2 = new Table({
            width: this.TABLE_WIDTH,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Nombre:',
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: evidence.userDisplayName,
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Rol:',
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Programador',
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table3 = new Table({
            width: this.TABLE_WIDTH,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Fecha:',
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: evidence.date,
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table4 = new Table({
            width: this.TABLE_WIDTH,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Breve descripción de la actividad:',
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        const table5 = new Table({
            width: this.TABLE_WIDTH,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: this.getIssuesParagraphs(evidence),
                        }),
                    ],
                }),
            ],
        });

        const table6 = new Table({
            width: this.TABLE_WIDTH,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: 'Evidencia Técnica',
                                            size: this.SIZE,
                                            font: this.FONT,
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
            ],
        });

        return [table1, new Paragraph(''), table2, new Paragraph(''), table3, new Paragraph(''), table4, new Paragraph(''), table5, new Paragraph(''), table6, new Paragraph('')];
    }

    /**
     * Determines by the request body if evidence template is only for jira or redmine
     * @param {ICreateTemplateInput} request - the request to get user issues
     * @returns {PageTypeEnum | undefined} returns page type enum or undefined
     */
    public getPageType(request: ICreateTemplateInput): PageTypeEnum | undefined {
        if (Boolean(request.jira_username) && !Boolean(request.redmine_id)) {
            return PageTypeEnum.JIRA;
        }
        if (!Boolean(request.jira_username) && Boolean(request.redmine_id)) {
            return PageTypeEnum.REDMINE;
        }
        return undefined;
    }

    /**
     * Creates Evidence Template Doc of the year
     * @param {ICreateTemplateInput} request - the request to get user issues
     * @returns {Promise<ICreateTemplateYearOutput>} Async promise to get Evidence description for the Word Template
     */
    public async createTemplatesYear(request: ICreateTemplateInput): Promise<ICreateTemplateYearOutput> {
        log.info('Start UserIssueService@createTemplatesYear method');
        const startTime = performance.now();

        const response: ICreateTemplateYearOutput = {
            userDisplayName: '',
            evidencesCreated: {
                total: 0,
                evidences: [],
            },
            evidencesWithErrors: {
                total: 0,
                evidences: [],
            },
        };

        for (let index = 1; index <= request.month; index++) {
            let evidence: IEvidence;

            try {
                evidence = await this.createTemplate({ ...request, month: index });
            } catch (error: any) {
                response.evidencesWithErrors.evidences.push({
                    date: `${MONTHS(request.year)[index - 1].displayName} de ${request.year}`,
                    errorMessage: error.message,
                });
                response.evidencesWithErrors.total++;
                continue;
            }

            if (index === 1) {
                response.userDisplayName = evidence.userDisplayName;
            }

            response.evidencesCreated.evidences.push({
                project: evidence.project,
                date: evidence.date,
                month: evidence.month,
                total: evidence.total,
                path: evidence.path,
            });
            response.evidencesCreated.total++;
        }

        const endTime = performance.now();
        log.info(`Finish UserIssueService@createTemplatesYear method in: ${endTime - startTime} ms`);
        return response;
    }

    /**
     * Split evidence by page type to login each one
     * @param {IEvidence} evidence
     * @param {ICreateTemplateInput} request
     * @returns {Promise<Paragraph[]>} Paragraphs in the Template with the processed Images Buffers
     */
    public async splitIssuesByTypeAndGetImages(evidence: IEvidence, request: ICreateTemplateInput): Promise<Paragraph[]> {
        let images: Paragraph[] = [];

        if (!evidence.issues || evidence.issues.length === 0) {
            return images;
        }

        for (const pageType in PageTypeEnum) {
            if (PageTypeEnum.hasOwnProperty(pageType)) {
                const issues: IIssueDescription[] = evidence.issues.filter((issue) => {
                    return issue.pageType === pageType;
                });
                if (issues.length === 0) {
                    continue;
                }
                const result: Paragraph[] = await this.getEvidenceImages({ ...evidence, issues }, request);
                images = images.concat(result);
            }
        }

        return images;
    }

    /**
     * Maps the User Issues Description to Write the Document Template
     * @param {IEvidence} evidences - evidence text to display in the template
     * @returns {Paragraph[]} returns the list of paragraphs
     */
    public getIssuesParagraphs(evidences: IEvidence): Paragraph[] {
        log.info(' Start UserIssueService@getIssuesParagraphs method');
        const paragraphs: Paragraph[] = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: evidences.evidenceStart,
                        size: this.SIZE,
                        font: this.FONT,
                    }),
                ],
            }),
        ];

        evidences.issues!.forEach((element) => {
            paragraphs.push(
                new Paragraph(''),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: element.title,
                            bold: true,
                            size: this.SIZE,
                            font: this.FONT,
                        }),
                        new TextRun({
                            text: element.summary,
                            size: this.SIZE,
                            font: this.FONT,
                        }),
                        new ExternalHyperlink({
                            children: [
                                new TextRun({
                                    text: element.link,
                                    style: 'Hyperlink',
                                }),
                            ],
                            link: element.link,
                        }),
                    ],
                }),
            );
        });
        log.info(' Finish UserIssueService@getIssuesParagraphs method');
        return paragraphs;
    }

    /**
     * Goes to Jira Cloud or Redmine url, makes login, and takes an screenshot of the issue
     * @param {IIssueDescription} issue - Jira Cloud url
     * @param {Browser} browser - Browser instance
     * @param {boolean} isLogin - indicates if it is the first time going to take screenshot, it needs login first
     * @param {string} getCredentials - getCredentials header to make login
     * @returns {Promise<Buffer>} returns the image buffer to be copied into the template
     */
    public async takeScreenshot(issue: IIssueInfoToTakeScreenshot, browser: Browser, isLogin: boolean, getCredentials: string[]): Promise<Buffer> {
        log.info('  Start UserIssueService@getIssues takeScreenshot with params:', { url: issue.link });
        const page = await browser.newPage();

        if (issue.pageType === PageTypeEnum.JIRA) {
            await page.setViewport(this.VIEWPORT_SIZE);
        }

        if (issue.pageType === PageTypeEnum.REDMINE) {
            await page.setViewport(this.VIEWPORT_SIZE);
        }

        await page.goto(issue.link, { waitUntil: 'load' });

        if (isLogin) {
            const [username, password] = getCredentials;

            if (issue.pageType === PageTypeEnum.JIRA) {
                await page.type('input[id="login-form-username"]', username);

                await page.type('input[id="login-form-password"]', password);

                await page.focus('input[id=login-form-submit]');

                await page.click('input[id=login-form-submit]');

                await page.waitForNavigation();

                await page.evaluate(this.forceScroll());
            }

            if (issue.pageType === PageTypeEnum.REDMINE) {
                await page.type('input[id="username"]', username);

                await page.type('input[id="password"]', password);

                await page.focus('input[id=login-submit]');

                await page.click('input[id=login-submit]');

                await page.waitForNavigation();

                await page.evaluate(this.forceScroll);
            }
        }

        const screenshotArray: Uint8Array = await page.screenshot();
        const screenshotBuffer: Buffer = Buffer.from(screenshotArray);

        await page.close();

        log.info('  Finish UserIssueService@getIssues takeScreenshot');
        return screenshotBuffer as Buffer;
    }

    public forceScroll(): () => void {
        return () => {
            window.scrollTo(0, 0);
            window.addEventListener('scroll', () => {
                window.scrollTo(0, 0);
            });
        };
    }

    /**
     * Maps the User Issues Description to get Evidence Images for the Document Template
     * @param {IEvidence} evidence - issue data array
     * @param {IUserIssuesInput} request - authorization token to make login
     * @returns {Promise<Paragraph[]>} returns the Paragraph with the image to be copied into the template
     */
    public async getEvidenceImages(evidence: IEvidence, request: IUserIssuesInput): Promise<Paragraph[]> {
        log.info(' Start UserIssueService@getEvidenceImages method');
        const browser: Browser = await puppeteer.launch(this.PUPPETEER_LAUNCH_OPTIONS);

        const paragraphs: Paragraph[] = [];

        for (let index = 0; index < evidence.issues!.length; index++) {
            let imageBase64Data;

            try {
                imageBase64Data = await this.takeScreenshot(evidence.issues![index], browser, index === 0, request.header.getCredentials);
            } catch (error) {
                log.error(' Error UserIssueService@getEvidenceImages trying to take screenshot');
                continue;
            }

            paragraphs.push(
                new Paragraph({
                    style: 'height: 100%',
                    children: [
                        new TextRun({
                            text: evidence.issues![index].title,
                            bold: true,
                            size: this.SIZE,
                            font: this.FONT,
                        }),
                        new ImageRun({
                            type: 'jpg',
                            data: imageBase64Data,
                            transformation: this.IMAGE_SIZE,
                        }),
                    ],
                }),
            );
        }

        if (evidence.issues![0].pageType === PageTypeEnum.REDMINE) {
            const url: string = `${this.REDMINE_BASE_URL}/projects/${evidence.issues![0].project.toLowerCase()}/activity?from=${request.year}-${request.month}-${MONTHS(request.year)[request.month - 1].days}&user_id=${request.redmine_id}`;

            log.info('  UserIssueService@getEvidenceImages last redmine screenshot url:', url);

            const page = await browser.newPage();
            await page.setViewport(this.VIEWPORT_SIZE);

            await page.goto(url, { waitUntil: 'load' });

            const element = await page.waitForSelector(`div`);

            const screenshotArray: Uint8Array = await element?.screenshot()!;
            const screenshotBuffer: Buffer = Buffer.from(screenshotArray);

            await page.close();

            paragraphs.push(
                new Paragraph({
                    style: 'height: 100%',
                    children: [
                        new TextRun({
                            text: `Evidencia de la Actividad de ${evidence.userDisplayName} en Redmine del mes de ${evidence.month}`,
                            bold: true,
                            size: this.SIZE,
                            font: this.FONT,
                        }),
                        new ImageRun({
                            type: 'jpg',
                            data: screenshotBuffer,
                            transformation: this.IMAGE_SIZE_LAST_REDMINE_IMAGE,
                        }),
                    ],
                }),
            );
        }

        await browser.close();
        log.info(' Finish UserIssueService@getEvidenceImages method');
        return paragraphs;
    }

    /**
     * Gets download links response
     * @param {IGetDownloadLinksInput} request year offset and limit get params
     * @returns {Promise<IUserTemplate[]>} returns user templates array with download url
     */
    public async getDownloadLinks(request: IGetDownloadLinksInput): Promise<IGetDownloadLinksOutput[]> {
        log.info('Start UserIssueService@getDownloadLinks method');

        const [username] = request.header.getCredentials;

        const userTemplates = await userTemplateService.getUserTemplates({
            username,
            pageType: request.pageType,
            year: request.year,
            offset: request.offset,
            limit: request.limit,
        });

        log.info('Finish UserIssueService@getDownloadLinks');
        return userTemplates.map((template) => {
            const register = template.toObject();
            return {
                pageType: register.pageType,
                year: register.year,
                month: register.month,
                downloadUrl: this.PROTOCOL_URL! + this.BASE_URL! + this.PORT! + '/user-issues/download/' + register._id,
            };
        });
    }

    /**
     * Gets download links response
     * @param {string} id year offset and limit get params
     * @returns {Promise<IUserTemplate[]>} returns user templates array with download url
     */
    public async downloadTemplate(id?: string): Promise<IDownloadOutput> {
        log.info('Start UserIssueService@downloadTemplate method with id:', id);

        if (!id) {
            throw new BaseErrorClass(INTERNAL_ERROR_CODES.BAD_REQUEST);
        }

        let userTemplate;

        try {
            userTemplate = await userTemplateService.getById(id);
        } catch (error) {
            log.info('Error UserIssueService@downloadTemplate', error);
            throw new BaseErrorClass(INTERNAL_ERROR_CODES.GENERAL_UNKNOWN);
        }

        if (!userTemplate || !userTemplate.path) {
            throw new BaseErrorClass({
                code: INTERNAL_ERROR_CODES.USER_TEMPLATE_NOT_FOUND.code,
                message: INTERNAL_ERROR_CODES.USER_TEMPLATE_NOT_FOUND.message + id,
                responseStatus: INTERNAL_ERROR_CODES.USER_TEMPLATE_NOT_FOUND.responseStatus,
            });
        }

        if (!fs.existsSync(userTemplate.path)) {
            throw new BaseErrorClass({
                code: INTERNAL_ERROR_CODES.FILE_NOT_FOUND.code,
                message: INTERNAL_ERROR_CODES.FILE_NOT_FOUND.message + userTemplate.path,
                responseStatus: INTERNAL_ERROR_CODES.FILE_NOT_FOUND.responseStatus,
            });
        }

        log.info('Finish UserIssueService@downloadTemplate path:', userTemplate.path);
        return { path: userTemplate.path };
    }
}
