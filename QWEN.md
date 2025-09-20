# Rapid7 MCP Server - Context for Qwen Code

## Project Overview

This is a Model Context Protocol (MCP) server that provides access to Rapid7 InsightIDR log querying capabilities through AI assistants. It allows users to query Rapid7 logs using natural language, with support for time-based filtering, pagination, and LEQL (Log Entry Query Language) filtering.

### Key Technologies
- Node.js with ES Modules
- Model Context Protocol SDK (@modelcontextprotocol/sdk)
- node-fetch for HTTP requests
- Zod for schema validation
- Jest for testing

## Project Structure

```
rapid7-mcp-server/
├── mcp-server.js          # Main server implementation with all tool handlers
├── index.js               # AWS Lambda handler entry point
├── bin/mcp-server.js      # CLI entry point for running as standalone server
├── package.json           # Dependencies, scripts, and metadata
├── README.md              # Project documentation
├── jest.config.js         # Jest testing configuration
├── .gitignore             # Git ignore patterns
├── test/                  # Unit tests for each tool
│   ├── queryRapid7Logset.test.js
│   ├── queryRapid7LogsetByName.test.js
│   ├── listRapid7Logsets.test.js
│   └── pollRapid7Query.test.js
└── node_modules/          # Dependencies (git ignored)
```

## Core Functionality

The server provides four main tools:

1. **queryRapid7Logset** - Query Rapid7 logs by logset ID with time range and optional filtering
2. **queryRapid7LogsetByName** - Query Rapid7 logs by logset name with time range and optional filtering
3. **listRapid7Logsets** - List all available logsets in the Rapid7 account
4. **pollRapid7Query** - Poll the status of a running Rapid7 query

## Environment Variables

- **RAPID7_API_KEY** (required) - Your Rapid7 InsightIDR API key
- **RAPID7_BASE_URL** (optional) - Rapid7 API base URL (defaults to EU region)

## Running the Server

### As a Standalone MCP Server
```bash
node mcp-server.js
```

Or using the bin script:
```bash
./bin/mcp-server.js
```

### With MCP Inspector (for development/testing)
```bash
npm run inspector
```

### As AWS Lambda Function
The server can also be deployed as an AWS Lambda function using the handler in `index.js`.

## Testing

Run all tests:
```bash
npm test
```

Tests use mocked API calls, so no real API keys are needed. The test suite uses Jest with ES module support.

## Building and Deployment

Create a deployment package:
```bash
npm run deploy
```

This creates a function.zip file with all necessary files and dependencies for deployment.

## Development Conventions

- Uses ES Modules (import/export syntax)
- Exports tool handler functions for testability
- Comprehensive error handling for API failures, network issues, and invalid parameters
- All datetime parameters use ISO8601 format
- All API responses are returned as JSON with proper MIME type
- Uses Zod for parameter validation
- Separates tool logic from MCP registration for easier testing

## API Endpoints Used

- Base URL: `https://eu.rest.logs.insight.rapid7.com` (configurable)
- `/query/logsets/{logsetId}` - Query logs by logset ID
- `/query/logsets` - Query logs by logset name
- `/management/logsets` - List available logsets
- `/query/{queryId}` - Poll query status

## Configuration for MCP Clients

To use this server with MCP-compatible applications, configure them with:

```json
{
  "mcpServers": {
    "rapid7": {
      "command": "node",
      "args": [
        "/path/to/your/rapid7-mcp-server/mcp-server.js"
      ],
      "env": {
        "RAPID7_API_KEY": "your-api-key-here",
        "RAPID7_BASE_URL": "https://eu.rest.logs.insight.rapid7.com"
      }
    }
  }
}
```