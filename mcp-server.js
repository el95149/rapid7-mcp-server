import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {z} from "zod"
import fetch from "node-fetch"


// Read environment variables
const API_KEY = process.env.RAPID7_API_KEY
const BASE_URL = process.env.RAPID7_BASE_URL || "https://eu.rest.logs.insight.rapid7.com"

if (!API_KEY) {
    throw new Error("Environment variable RAPID7_API_KEY is not set. Please set it before running the server.")
}

const server = new McpServer({
    name: "MCP Server Boilerplate",
    version: "1.0.0",
})

server.tool(
    "queryRapid7Logset",
    "Query Rapid7 logs with specified parameters for an entire log set",
    {
        from: z.string().describe("Start datetime in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)"),
        to: z.string().describe("End datetime in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)"),
        perPage: z.number().default(100).describe("Number of results per page (default: 100)"),
        logsetId: z.string().describe("Logset ID"),
        query: z.string().optional().describe("Optional log query (can be omitted). Typical syntax: where(\"search term\", loose)"),
    },
    async ({from, to, perPage, logsetId, query}) => {
        try {
            // Convert ISO8601 datetime strings to UNIX timestamps (milliseconds)
            const fromTimestamp = new Date(from).getTime()
            const toTimestamp = new Date(to).getTime()

            // Validate the conversion
            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error("Invalid datetime format. Please use ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)")
            }

            const url = `${BASE_URL}/query/logsets/${logsetId}`

            // Build query parameters conditionally
            const params = new URLSearchParams({
                from: fromTimestamp.toString(),
                to: toTimestamp.toString(),
                per_page: perPage.toString(),
                kvp_info: "false",
            })

            // Only add query parameter if it's non-empty
            if (query && query.trim()) {
                params.append('query', query)
            }

            const response = await fetch(`${url}?${params}`, {
                method: "GET",
                headers: {
                    "x-api-key": API_KEY,
                },
            })

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`)
            }

            // Check content type
            const contentType = response.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text()
                throw new Error(`Unexpected response format: ${text}`)
            }

            const data = await response.json()
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                        mimeType: "application/json"
                    }
                ]
            }
        } catch (error) {
            return {
                content: [{type: "text", text: `Error: ${error.message}`}],
            }
        }
    }
)

server.tool(
    "pollRapid7Query",
    "Poll the status of a running Rapid7 log query using its query ID",
    {
        queryId: z.string().describe("The unique ID of the query to poll (as returned by the queryRapid7Logs tool)"),
        timeRange: z.string().optional().describe("Optional time range (e.g., 'last 1 day', 'last 7 days'). If omitted, defaults to 'last 1 day'."),
    },
    async ({queryId, timeRange}) => {
        try {
            // Default time range if not provided
            const effectiveTimeRange = timeRange || "last 1 day"

            // Construct the URL with the query ID and time range
            const url = `${BASE_URL}/query/${queryId}?time_range=${encodeURIComponent(effectiveTimeRange)}`

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "x-api-key": API_KEY,
                },
            })

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`)
            }

            // Check content type
            const contentType = response.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text()
                throw new Error(`Unexpected response format: ${text}`)
            }

            const data = await response.json()
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                        mimeType: "application/json"
                    }
                ]
            }
        } catch (error) {
            return {
                content: [{type: "text", text: `Error: ${error.message}`}],
            }
        }
    }
)

server.tool(
    "listRapid7Logsets",
    "List all available Rapid7 logs sets",
    {},
    async () => {
        try {
            const url = `${BASE_URL}/management/logsets`

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "x-api-key": API_KEY,
                },
            })

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`)
            }

            // Check content type
            const contentType = response.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text()
                throw new Error(`Unexpected response format: ${text}`)
            }

            const data = await response.json()
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                        mimeType: "application/json"
                    }
                ]
            }
        } catch (error) {
            return {
                content: [{type: "text", text: `Error: ${error.message}`}],
            }
        }
    }
)

server.tool(
    "queryRapid7LogsetByName",
    "Query Rapid7 logs with specified parameters for a logset identified by name",
    {
        logsetName: z.string().describe("Name of the logset to query"),
        from: z.string().describe("Start datetime in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)"),
        to: z.string().describe("End datetime in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)"),
        perPage: z.number().default(100).describe("Number of results per page (default: 100)"),
        query: z.string().optional().describe("Optional log query (can be omitted). Typical syntax: where(\"search term\", loose)"),
    },
    async ({ logsetName, from, to, perPage, query }) => {
        try {
            // Convert ISO8601 datetime strings to UNIX timestamps (milliseconds)
            const fromTimestamp = new Date(from).getTime()
            const toTimestamp = new Date(to).getTime()

            // Validate the conversion
            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error("Invalid datetime format. Please use ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)")
            }

            const url = `${BASE_URL}/query/logsets`

            // Build query parameters
            const params = new URLSearchParams({
                logset_name: logsetName,
                from: fromTimestamp.toString(),
                to: toTimestamp.toString(),
                per_page: perPage.toString(),
                kvp_info: "false",
            })

            // Only add query parameter if it's non-empty
            if (query && query.trim()) {
                params.append('query', query)
            }

            const response = await fetch(`${url}?${params}`, {
                method: "GET",
                headers: {
                    "x-api-key": API_KEY,
                },
            })

            // Check if response is ok
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`)
            }

            // Check content type
            const contentType = response.headers.get("content-type")
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text()
                throw new Error(`Unexpected response format: ${text}`)
            }

            const data = await response.json()
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(data, null, 2),
                        mimeType: "application/json"
                    }
                ]
            }
        } catch (error) {
            return {
                content: [{ type: "text", text: `Error: ${error.message}` }],
            }
        }
    }
)

const transport = new StdioServerTransport()
await server.connect(transport)
