import bodyParser from 'body-parser';
import express from 'express';
import getLogger from './utils/logger';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import mainRoutes from './routes/main.route';
import userIssueRoutes from './routes/userIssue.route';

const log = getLogger('app.js');

/*--- App ---*/
const app = express();
const port = process.env.PORT;

/*--- Swagger ---*/
const swaggerDefinition = {
    basePath: '/',
    host: 'localhost:3000',
    info: {
        description: 'This is a project to consume jira cloud rest api and process data to build documents for evidences',
        title: 'Imatia Audit Evidences Maker',
        version: '1.0.0',
    },
    openapi: '3.0.3',
    schemes: ['http'],
};
const options = {
    apis: ['./src/docs/**/*.yaml'],
    swaggerDefinition,
};
const swaggerSpec = swaggerJSDoc(options);

// APP
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/user-issues', userIssueRoutes);

app.use('/', mainRoutes);

app.listen(port, () => {
    log.info(() => `Briefcase app listen on port ${port}!`);
});
