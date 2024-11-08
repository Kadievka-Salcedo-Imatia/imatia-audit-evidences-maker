# Imatia Audit Evidence Maker

This is a project to consume jira cloud rest api and process data to build documents for evidences.

## Requirements

- Node v20.18.0
- Git 2.41.0.windows.3
- Postman v11.17.0

## Common setup

Clone the repo and install the dependencies.

> npm install

Create the .env file on the root of the project and inject your credentials so it looks like this, check the .env.example file to see credentials

> # Project
> PROTOCOL_URL=http://
> BASE_URL=localhost:
> PORT=3000
> 
> # Jira
> JIRA_CLOUD_URL=https://jiracloud-example.com
> JIRA_REST_API_2_SEARCH_URL='/rest/api/2/search'
> DEFAULT_JQL='assignee in ({{jira_username}}) AND updated >= {{startDate}} AND {{updated}} <= endDate'
> 
> # Redmine
> REDMINE_BASE_URL=https://redmine-example.com
> REDMINE_URL=/issues.json
> REDMINE_PAGINATION_LIMIT=100
> REDMINE_ISSUE_STATUS_ID=*
> 
> # MongoDB is part of Redmine synchronization
> MONGODB_CONNECTION_STRING=mongodb://userExample:passwordExample@localhost:27017/
> MONGODB_DB_NAME="imatia-audit-evidences-maker"

## Steps for read-only access

To start the express server, run the following

> npm run start:dev

Open http://localhost:3000/docs and take a look around the Swagger UI.

## Steps for read and write access (recommended)

- Step 1: To start the express server, run the following

> npm run start:dev

- Final Step:

Open http://localhost:3000 and take a look around with postman app.

## Redmine Sync with MongoDB

If you want to get evidence templates from Redmine, the first endpoint you should use is POST 'http://localhost:3000/user-issues/sync-redmine' with the params:

    {
	    "status_id":  "*",
	    "limit":  100,
	    "offset":  0
    }
  

## Run scripts

If you want to run scripts from the path src/scripts/script-name.ts use the commands below:

> npm install -g ts-node

ts-node src/scripst/script-name.ts

If the script needs some arguments, use the following:

> ts-node src/scripst/script-name.ts arg1 arg2 arg3 ...

## Docker

docker compose -f "docker-compose.yml" up -d --build

### MongoDB

Use the file docker-compose.yml to up the mongodb image and after that, be sure you can connect with the database with a database manager, example MongoDB Compass using the connection string en .env file MONGODB_CONNECTION_STRING=mongodb://userExample:passwordExample@localhost:27017/