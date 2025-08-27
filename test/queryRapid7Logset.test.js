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
const {queryRapid7Logset} = await import('../mcp-server.js');
const {default: fetch} = await import('node-fetch');

describe('queryRapid7Logset', () => {

    beforeEach(() => {
        // Set up default successful mock
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({
                query: {
                    id: 'query-123',
                    status: 'running'
                },
                events: [
                    {timestamp: '2023-01-01T00:00:00Z', message: 'Test log entry 1'},
                    {timestamp: '2023-01-01T00:01:00Z', message: 'Test log entry 2'}
                ]
            }),
            text: jest.fn().mockResolvedValue('{"query":{"id":"query-123","status":"running"},"events":[{"timestamp":"2023-01-01T00:00:00Z","message":"Test log entry 1"},{"timestamp":"2023-01-01T00:01:00Z","message":"Test log entry 2"}]}'),
            headers: new Map([['content-type', 'application/json']])
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return query results when API call succeeds', async () => {
        const result = await queryRapid7Logset({
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123',
            query: 'where("error", loose)'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem).to.have.property('mimeType', 'application/json');

        const parsedData = JSON.parse(contentItem.text);
        expect(parsedData).to.have.property('query');
        expect(parsedData).to.have.property('events');
        expect(parsedData.events).to.be.an('array').with.lengthOf(2);
    });

    it('should make correct API call with proper parameters', async () => {
        const from = '2023-01-01T00:00:00Z';
        const to = '2023-01-01T23:59:59Z';
        const logsetId = 'logset-123';
        const query = 'where("error", loose)';
        const perPage = 50;

        await queryRapid7Logset({from, to, perPage, logsetId, query});

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url, options] = fetch.mock.calls[0];
        
        // Check URL structure
        expect(url).to.include(`${mockBaseUrl}/query/logsets/${logsetId}`);
        expect(url).to.include(`from=${new Date(from).getTime()}`);
        expect(url).to.include(`to=${new Date(to).getTime()}`);
        expect(url).to.include(`per_page=${perPage}`);
        expect(url).to.include(`kvp_info=false`);
        expect(url).to.include(`query=where%28%22error%22%2C+loose%29`);

        // Check headers
        expect(options.headers).to.have.property('x-api-key', mockApiKey);
        expect(options.method).to.equal('GET');
    });

    it('should work without optional query parameter', async () => {
        await queryRapid7Logset({
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123'
        });

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        expect(url).to.not.include('query=');
    });

    it('should work with empty query parameter', async () => {
        await queryRapid7Logset({
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123',
            query: ''
        });

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        expect(url).to.not.include('query=');
    });

    it('should return error content when API returns 401 Unauthorized', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
            text: jest.fn().mockResolvedValue('{"error":"Invalid API key"}')
        });

        const result = await queryRapid7Logset({
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('API request failed: 401 Unauthorized');
    });

    it('should return error for invalid datetime format', async () => {
        const result = await queryRapid7Logset({
            from: 'invalid-date',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Invalid datetime format');
    });

    it('should return error when RAPID7_API_KEY is missing', async () => {
        // Clear the API key environment variable
        delete process.env.RAPID7_API_KEY;

        // Reset the module to re-import with missing API key
        jest.resetModules();

        // Re-import the module after clearing the env
        const {queryRapid7Logset} = await import('../mcp-server.js');

        const result = await queryRapid7Logset({
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Environment variable RAPID7_API_KEY is not set');
    });

    it('should return error content when fetch fails (network error)', async () => {
        fetch.mockRejectedValue(new Error('Network error'));

        const result = await queryRapid7Logset({
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Network error');
    });

    it('should handle unexpected response format', async () => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map([['content-type', 'text/plain']]),
            text: jest.fn().mockResolvedValue('Not JSON response')
        });

        const result = await queryRapid7Logset({
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            logsetId: 'logset-123'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Unexpected response format');
    });
});
