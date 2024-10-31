// External Dependencies
import * as mongoDB from 'mongodb';
import getLogger from '../utils/logger';

const log = getLogger('database.service.ts');

export default class DatabaseService {
    public static instance: DatabaseService;

    /**
     * Returns the single instance of DatabaseService.
     * @returns DatabaseService - Singleton instance
     */
    public static getInstance() {
        if (!this.instance) {
            this.instance = new DatabaseService();
        }
        return this.instance;
    }

    public collections: Record<string, any> = {};

    private mongodbClient: mongoDB.MongoClient;
    private db?: mongoDB.Db;

    public constructor() {
        this.mongodbClient = new mongoDB.MongoClient(process.env.MONGODB_CONNECTION_STRING!);
        log.info('MongoDB client created');
    }

    /**
     * Opens a connection to the database and collection
     * @param {string} collection name to connect to de database
     * @returns {Promise<void>} void
     */
    public async connect(collection: string): Promise<void> {
        await this.mongodbClient.connect();
        this.db = this.mongodbClient.db(process.env.MONGODB_DB_NAME!);

        const dbCollection: mongoDB.Collection<mongoDB.BSON.Document> = this.db.collection(collection);
        this.collections[collection] = dbCollection;
    }

    /**
     * Closes a connection to the database
     * @returns {Promise<void>} void
     */
    public async disconnect(): Promise<void> {
        await this.mongodbClient.close();
    }
}
