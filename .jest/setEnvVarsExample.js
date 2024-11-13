// Environment variables for unit tests

// Project
process.env.PROTOCOL_URL='http:'//
process.env.BASE_URL='localhost:'
process.env.PORT=3000

// Jira
process.env.JIRA_CLOUD_URL='https://jiracloud-example.com'
process.env.JIRA_REST_API_2_SEARCH_URL='/rest/api/2/search'
process.env.DEFAULT_JQL='assignee in ({{jira_username}}) AND updated >= {{startDate}} AND {{updated}} <= endDate'

// Redmine
process.env.REDMINE_BASE_URL='https://redmine-example.com'
process.env.REDMINE_URL='/issues.json'
process.env.REDMINE_PAGINATION_LIMIT=100
process.env.REDMINE_ISSUE_STATUS_ID='*'

// MongoDB is part of Redmine synchronization
process.env.MONGODB_CONNECTION_STRING="mongodb:'//userExample:passwordExample@localhost:27017/'"
process.env.MONGODB_DB_NAME='imatia-audit-evidences-maker'


//DB user_templates table
process.env.USER_TEMPLATES_LIMIT_DEFAULT=100
