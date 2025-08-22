# Rapid7 MCP Server

A Model Context Protocol (MCP) server that provides access to Rapid7 InsightIDR log querying capabilities through AI assistants.

## Features

- Query Rapid7 InsightIDR logs using natural language through AI assistants
- Support for time-based log filtering with ISO8601 datetime format
- Configurable pagination and logset targeting
- Optional query filtering with LEQL (Log Entry Query Language)
- Automatic datetime conversion from ISO8601 to UNIX timestamps
- List available logsets and query by name
- Poll running query status

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Testing (TLDR)

```bash
# Run all tests
npm test
```

Tests use mocked API calls - no real API keys needed.

## Configuration

You'll need:
- A valid Rapid7 InsightIDR API key
- Access to the Rapid7 EU region (or modify the URL for other regions)
- The logset ID you want to query (or use the listRapid7Logsets tool to discover them)

## MCP Client Configuration

To use this server with MCP-compatible applications, you need to configure them with the server path and required environment variables.

### Environment Variables

- **RAPID7_API_KEY**: Your Rapid7 InsightIDR API key (required)
- **RAPID7_BASE_URL**: The Rapid7 API base URL (optional, defaults to EU region)

### Configuration Example

Add this configuration to your MCP config file:

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

### Regional Configuration

For different Rapid7 regions, update the `RAPID7_BASE_URL`:

- **EU**: `https://eu.rest.logs.insight.rapid7.com` (default)
- **US**: `https://us.rest.logs.insight.rapid7.com`
- **CA**: `https://ca.rest.logs.insight.rapid7.com`
- **AU**: `https://au.rest.logs.insight.rapid7.com`
- **AP**: `https://ap.rest.logs.insight.rapid7.com`

### Security Notes

- Never commit your API key to version control
- Store API keys securely using your system's credential management
- Consider using environment variables or secure vaults for production deployments
- Ensure your API key has appropriate permissions for log querying

## Usage

### Running the Server

```bash
node mcp-server.js
```

### Using with MCP Inspector

For testing and development:

```bash
npm run inspector
```

## Available Tools

### 1. queryRapid7Logset

Query Rapid7 logs with specified parameters for an entire log set using logset ID.

#### Parameters

- **from** (string, required): Start datetime in ISO8601 format (e.g., "2024-01-15T10:00:00Z")
- **to** (string, required): End datetime in ISO8601 format (e.g., "2024-01-15T11:00:00Z")
- **perPage** (number, optional): Number of results per page (default: 100)
- **logsetId** (string, required): The Rapid7 logset ID to query
- **query** (string, optional): LEQL query string for filtering logs

#### Example Usage

```json
{
  "from": "2024-01-15T10:00:00Z",
  "to": "2024-01-15T11:00:00Z",
  "perPage": 50,
  "logsetId": "your-logset-id",
  "query": "where(source_ip=192.168.1.1)"
}
```

### 2. queryRapid7LogsetByName

Query Rapid7 logs with specified parameters for a logset identified by name instead of ID.

#### Parameters

- **logsetName** (string, required): Name of the logset to query
- **from** (string, required): Start datetime in ISO8601 format (e.g., "2024-01-15T10:00:00Z")
- **to** (string, required): End datetime in ISO8601 format (e.g., "2024-01-15T11:00:00Z")
- **perPage** (number, optional): Number of results per page (default: 100)
- **query** (string, optional): LEQL query string for filtering logs

#### Example Usage

```json
{
  "logsetName": "Security Events",
  "from": "2024-01-15T10:00:00Z",
  "to": "2024-01-15T11:00:00Z",
  "perPage": 100,
  "query": "where(\"failed login\", loose)"
}
```

### 3. listRapid7Logsets

List all available Rapid7 log sets in your account. Useful for discovering logset names and IDs.

#### Parameters

None required.

#### Example Usage

```json
{}
```

#### Response

Returns a list of all available logsets with their IDs, names, and descriptions.

### 4. pollRapid7Query

Poll the status of a running Rapid7 log query using its query ID. Useful for long-running queries.

#### Parameters

- **queryId** (string, required): The unique ID of the query to poll (as returned by query tools)
- **timeRange** (string, optional): Time range (e.g., 'last 1 day', 'last 7 days'). Defaults to 'last 1 day'

#### Example Usage

```json
{
  "queryId": "query-12345-abcdef",
  "timeRange": "last 7 days"
}
```

## Common Response Format

All tools return JSON-formatted data from Rapid7 InsightIDR, including:
- Log entries matching your criteria
- Metadata about the query execution
- Pagination information if applicable
- Query status for polling operations

## Error Handling

The server includes comprehensive error handling for:
- Invalid datetime formats
- API authentication failures
- Network connectivity issues
- Malformed responses
- Empty or invalid parameters
- Missing environment variables

## API Endpoints

This server connects to the Rapid7 EU REST API:
- Base URL: `https://eu.rest.logs.insight.rapid7.com`
- Query logset by ID: `/query/logsets/{logsetId}`
- Query logset by name: `/query/logsets`
- List logsets: `/management/logsets`
- Poll query: `/query/{queryId}`

To use a different region, modify the URL in `mcp-server.js`.

## Development

### Project Structure

```
rapid7-mcp-server/
├── mcp-server.js     # Main server implementation
├── package.json      # Dependencies and scripts
└── README.md         # This file
```

### Dependencies

- `@modelcontextprotocol/sdk`: MCP SDK for server implementation
- `node-fetch`: HTTP client for API requests
- `zod`: Schema validation for tool parameters

## License

MIT License

This project is licensed under the MIT License, one of the most permissive open source licenses available. You are free to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software.

## Support

For issues related to:
- This MCP server: Create an issue in this repository
- Rapid7 InsightIDR API: Consult the [Rapid7 API documentation](https://docs.rapid7.com/insightidr/api/)
- MCP protocol: Check the [Model Context Protocol documentation](https://modelcontextprotocol.io/)

