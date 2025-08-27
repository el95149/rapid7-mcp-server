import {expect} from 'chai';
import {jest} from '@jest/globals';

const mockApiKey = 'testKey';
const mockBaseUrl = 'https://eu.rest.logs.insight.rapid7.com';

// Set environment variables
process.env.RAPID7_API_KEY = mockApiKey;
process.env.RAPID7_BASE_URL = mockBaseUrl;

// Set up the mock before importing the module under test
jest.unstable_mockModule('node-fetch', () => ({
    default: jest.fn()
}));

// Import after setting up mocks
const {pollRapid7Query} = await import('../mcp-server.js');
const {default: fetch} = await import('node-fetch');

describe('pollRapid7Query', () => {

    beforeEach(() => {
        // Set up default successful mock
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({
                query: {
                    id: 'query-123',
                    status: 'completed',
                    progress: 100
                },
                results: {
                    total: 150,
                    events: [
                        {timestamp: '2023-01-01T00:00:00Z', message: 'Query result 1'},
                        {timestamp: '2023-01-01T00:01:00Z', message: 'Query result 2'}
                    ]
                }
            }),
            text: jest.fn().mockResolvedValue('{"query":{"id":"query-123","status":"completed","progress":100},"results":{"total":150,"events":[{"timestamp":"2023-01-01T00:00:00Z","message":"Query result 1"},{"timestamp":"2023-01-01T00:01:00Z","message":"Query result 2"}]}}'),
            headers: new Map([['content-type', 'application/json']])
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return query status when API call succeeds', async () => {
        const result = await pollRapid7Query({
            queryId: 'query-123',
            timeRange: 'last 7 days'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem).to.have.property('mimeType', 'application/json');

        const parsedData = JSON.parse(contentItem.text);
        expect(parsedData).to.have.property('query');
        expect(parsedData.query).to.have.property('id', 'query-123');
        expect(parsedData.query).to.have.property('status', 'completed');
        expect(parsedData).to.have.property('results');
    });

    it('should make correct API call with proper parameters', async () => {
        const queryId = 'query-456';
        const timeRange = 'last 24 hours';

        await pollRapid7Query({queryId, timeRange});

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url, options] = fetch.mock.calls[0];
        
        // Check URL structure
        expect(url).to.equal(`${mockBaseUrl}/query/${queryId}?time_range=${encodeURIComponent(timeRange)}`);

        // Check headers
        expect(options.headers).to.have.property('x-api-key', mockApiKey);
        expect(options.method).to.equal('GET');
    });

    it('should use default time range when not provided', async () => {
        const queryId = 'query-789';

        await pollRapid7Query({queryId});

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        
        expect(url).to.equal(`${mockBaseUrl}/query/${queryId}?time_range=${encodeURIComponent('last 1 day')}`);
    });

    it('should handle running query status', async () => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({
                query: {
                    id: 'query-123',
                    status: 'running',
                    progress: 45
                }
            }),
            text: jest.fn().mockResolvedValue('{"query":{"id":"query-123","status":"running","progress":45}}'),
            headers: new Map([['content-type', 'application/json']])
        });

        const result = await pollRapid7Query({queryId: 'query-123'});

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem).to.have.property('mimeType', 'application/json');

        const parsedData = JSON.parse(contentItem.text);
        expect(parsedData.query.status).to.equal('running');
        expect(parsedData.query.progress).to.equal(45);
    });

    it('should return error content when API returns 404 Not Found', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: jest.fn().mockResolvedValue({ error: 'Query not found' }),
            text: jest.fn().mockResolvedValue('{"error":"Query not found"}')
        });

        const result = await pollRapid7Query({queryId: 'nonexistent-query'});

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('API request failed: 404 Not Found');
    });

    it('should return error content when API returns 401 Unauthorized', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
            text: jest.fn().mockResolvedValue('{"error":"Invalid API key"}')
        });

        const result = await pollRapid7Query({queryId: 'query-123'});

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('API request failed: 401 Unauthorized');
    });

    it('should return error when RAPID7_API_KEY is missing', async () => {
        // Clear the API key environment variable
        delete process.env.RAPID7_API_KEY;

        // Reset the module to re-import with missing API key
        jest.resetModules();

        // Re-import the module after clearing the env
        const {pollRapid7Query} = await import('../mcp-server.js');

        const result = await pollRapid7Query({queryId: 'query-123'});

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Environment variable RAPID7_API_KEY is not set');
    });

    it('should return error content when fetch fails (network error)', async () => {
        fetch.mockRejectedValue(new Error('Network timeout'));

        const result = await pollRapid7Query({queryId: 'query-123'});

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Network timeout');
    });

    it('should handle unexpected response format', async () => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map([['content-type', 'text/html']]),
            text: jest.fn().mockResolvedValue('<html>Not JSON</html>')
        });

        const result = await pollRapid7Query({queryId: 'query-123'});

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Unexpected response format');
    });

    it('should handle query with special characters in time range', async () => {
        const timeRange = 'from 2023-01-01 to 2023-01-02';
        const queryId = 'query-special';

        await pollRapid7Query({queryId, timeRange});

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        
        expect(url).to.include(encodeURIComponent(timeRange));
    });
});
