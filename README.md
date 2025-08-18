# Rapid7 MCP Server

A Model Context Protocol (MCP) server that provides access to Rapid7 InsightIDR log querying capabilities through AI assistants.

## Features

- Query Rapid7 InsightIDR logs using natural language through AI assistants
- Support for time-based log filtering with ISO8601 datetime format
- Configurable pagination and logset targeting
- Optional query filtering with LEQL (Log Entry Query Language)
- Automatic datetime conversion from ISO8601 to UNIX timestamps

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

You'll need:
- A valid Rapid7 InsightIDR API key
- Access to the Rapid7 EU region (or modify the URL for other regions)
- The logset ID you want to query

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

### Tool: queryRapid7Logs

Query Rapid7 logs with the following parameters:

#### Parameters

- **apiKey** (string, required): Your Rapid7 API key for authentication
- **from** (string, required): Start datetime in ISO8601 format (e.g., "2024-01-15T10:00:00Z")
- **to** (string, required): End datetime in ISO8601 format (e.g., "2024-01-15T11:00:00Z")
- **perPage** (number, required): Number of results per page (e.g., 100)
- **logsetId** (string, required): The Rapid7 logset ID to query
- **query** (string, optional): LEQL query string for filtering logs

#### Example Usage

```json
{
  "apiKey": "your-api-key-here",
  "from": "2024-01-15T10:00:00Z",
  "to": "2024-01-15T11:00:00Z",
  "perPage": 50,
  "logsetId": "your-logset-id",
  "query": "where(source_ip=192.168.1.1)"
}
```

#### Response

The tool returns JSON-formatted log data from Rapid7 InsightIDR, including:
- Log entries matching your criteria
- Metadata about the query execution
- Pagination information if applicable

## Error Handling

The server includes comprehensive error handling for:
- Invalid datetime formats
- API authentication failures
- Network connectivity issues
- Malformed responses
- Empty or invalid parameters

## API Endpoint

This server connects to the Rapid7 EU REST API:
- Base URL: `https://eu.rest.logs.insight.rapid7.com`
- Endpoint: `/query/logsets/{logsetId}`

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

[Add your license information here]

## Contributing

[Add contribution guidelines here]

## Support

For issues related to:
- This MCP server: Create an issue in this repository
- Rapid7 InsightIDR API: Consult the [Rapid7 API documentation](https://docs.rapid7.com/insightidr/api/)
- MCP protocol: Check the [Model Context Protocol documentation](https://modelcontextprotocol.io/)

