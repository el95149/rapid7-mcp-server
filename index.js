// Import functions from mcp-server.js
import {
    queryRapid7Logset,
    pollRapid7Query,
    listRapid7Logsets,
    queryRapid7LogsetByName
} from './mcp-server.js';

// AWS Lambda Handler
export const handler = async (event) => {
    const { action, input } = event;

    try {
        switch (action) {
            case 'listLogsets':
                return {
                    statusCode: 200,
                    body: JSON.stringify(await listRapid7Logsets())
                };

            case 'queryLogset':
                return {
                    statusCode: 200,
                    body: JSON.stringify(await queryRapid7Logset(input))
                };

            case 'pollQuery':
                return {
                    statusCode: 200,
                    body: JSON.stringify(await pollRapid7Query(input))
                };

            case 'queryLogsetByName':
                return {
                    statusCode: 200,
                    body: JSON.stringify(await queryRapid7LogsetByName(input))
                };

            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: `Unknown action: ${action}` })
                };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
