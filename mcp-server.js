import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js"
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js"
import {z} from "zod"
import fetch from "node-fetch"


const server = new McpServer({
    name: "MCP Server Boilerplate",
    version: "1.0.0",
})

server.tool(
    "queryRapid7Logs",
    "Query Rapid7 logs with specified parameters",
    {
        apiKey: z.string().describe("API key for authentication"),
        from: z.string().describe("Start datetime in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)"),
        to: z.string().describe("End datetime in ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)"),
        perPage: z.number().describe("Number of results per page"),
        logsetId: z.string().describe("Logset ID"),
        query: z.string().optional().describe("Optional log query (can be omitted)"),
    },
    async ({apiKey, from, to, perPage, logsetId, query}) => {
        try {
            // Convert ISO8601 datetime strings to UNIX timestamps (milliseconds)
            const fromTimestamp = new Date(from).getTime()
            const toTimestamp = new Date(to).getTime()

            // Validate the conversion
            if (isNaN(fromTimestamp) || isNaN(toTimestamp)) {
                throw new Error("Invalid datetime format. Please use ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)")
            }

            const url = `https://eu.rest.logs.insight.rapid7.com/query/logsets/${logsetId}`

            // Build query parameters conditionally
            const params = new URLSearchParams({
                from: fromTimestamp.toString(),
                to: toTimestamp.toString(),
                per_page: perPage.toString(),
            })

            // Only add query parameter if it's non-empty
            if (query && query.trim()) {
                params.append('query', query)
            }

            const response = await fetch(`${url}?${params}`, {
                method: "GET",
                headers: {
                    "x-api-key": apiKey,
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
        apiKey: z.string().describe("API key for authentication"),
        queryId: z.string().describe("The unique ID of the query to poll (e.g., c19c7d71-de32-4a6d-92b9-58e12dc38eb9:0:c5be1c97f925ee883347440071863897b83ef305:1:94b844d409485aa4152284708bf65f4b09d931f3)"),
        timeRange: z.string().optional().describe("Optional time range (e.g., 'last 1 day', 'last 7 days'). If omitted, defaults to 'last 1 day'."),
    },
    async ({apiKey, queryId, timeRange}) => {
        try {
            // Default time range if not provided
            const effectiveTimeRange = timeRange || "last 1 day"

            // Construct the URL with the query ID and time range
            const url = `https://eu.rest.logs.insight.rapid7.com/query/${queryId}?time_range=${encodeURIComponent(effectiveTimeRange)}`

            const response = await fetch(url, {
                method: "GET",
                headers: {
                    "x-api-key": apiKey,
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

const transport = new StdioServerTransport()
await server.connect(transport)
