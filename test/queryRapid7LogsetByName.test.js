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
const {queryRapid7LogsetByName} = await import('../mcp-server.js');
const {default: fetch} = await import('node-fetch');

describe('queryRapid7LogsetByName', () => {

    beforeEach(() => {
        // Set up default successful mock
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({
                query: {
                    id: 'query-456',
                    status: 'running',
                    logset_name: 'Security Logs'
                },
                events: [
                    {timestamp: '2023-01-01T00:00:00Z', message: 'Security event 1', source: 'firewall'},
                    {timestamp: '2023-01-01T00:02:00Z', message: 'Security event 2', source: 'ids'}
                ]
            }),
            text: jest.fn().mockResolvedValue('{"query":{"id":"query-456","status":"running","logset_name":"Security Logs"},"events":[{"timestamp":"2023-01-01T00:00:00Z","message":"Security event 1","source":"firewall"},{"timestamp":"2023-01-01T00:02:00Z","message":"Security event 2","source":"ids"}]}'),
            headers: new Map([['content-type', 'application/json']])
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return query results when API call succeeds', async () => {
        const result = await queryRapid7LogsetByName({
            logsetName: 'Security Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            query: 'where("firewall", loose)'
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem).to.have.property('mimeType', 'application/json');

        const parsedData = JSON.parse(contentItem.text);
        expect(parsedData).to.have.property('query');
        expect(parsedData.query).to.have.property('logset_name', 'Security Logs');
        expect(parsedData).to.have.property('events');
        expect(parsedData.events).to.be.an('array').with.lengthOf(2);
    });

    it('should make correct API call with proper parameters', async () => {
        const logsetName = 'Network Logs';
        const from = '2023-01-01T00:00:00Z';
        const to = '2023-01-01T23:59:59Z';
        const query = 'where("tcp", loose)';
        const perPage = 50;

        await queryRapid7LogsetByName({logsetName, from, to, perPage, query});

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url, options] = fetch.mock.calls[0];
        
        // Check URL structure
        expect(url).to.include(`${mockBaseUrl}/query/logsets`);
        expect(url).to.include(`logset_name=Network+Logs`);
        expect(url).to.include(`from=${new Date(from).getTime()}`);
        expect(url).to.include(`to=${new Date(to).getTime()}`);
        expect(url).to.include(`per_page=${perPage}`);
        expect(url).to.include(`kvp_info=false`);
        expect(url).to.include(`query=where%28%22tcp%22%2C+loose%29`);

        // Check headers
        expect(options.headers).to.have.property('x-api-key', mockApiKey);
        expect(options.method).to.equal('GET');
    });

    it('should work without optional query parameter', async () => {
        await queryRapid7LogsetByName({
            logsetName: 'Application Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        expect(url).to.not.include('query=');
        expect(url).to.include(`logset_name=Application+Logs`);
    });

    it('should work with empty query parameter', async () => {
        await queryRapid7LogsetByName({
            logsetName: 'System Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100,
            query: '   '
        });

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        expect(url).to.not.include('query=');
        expect(url).to.include(`logset_name=System+Logs`);
    });

    it('should handle logset names with special characters', async () => {
        const logsetName = 'Web Server Logs & Analytics';
        
        await queryRapid7LogsetByName({
            logsetName,
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        expect(url).to.include(`logset_name=Web+Server+Logs+%26+Analytics`);
    });

    it('should return error content when API returns 401 Unauthorized', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
            text: jest.fn().mockResolvedValue('{"error":"Invalid API key"}')
        });

        const result = await queryRapid7LogsetByName({
            logsetName: 'Security Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('API request failed: 401 Unauthorized');
    });

    it('should return error content when logset is not found', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 404,
            statusText: 'Not Found',
            json: jest.fn().mockResolvedValue({ error: 'Logset not found' }),
            text: jest.fn().mockResolvedValue('{"error":"Logset not found"}')
        });

        const result = await queryRapid7LogsetByName({
            logsetName: 'Nonexistent Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('API request failed: 404 Not Found');
    });

    it('should return error for invalid datetime format', async () => {
        const result = await queryRapid7LogsetByName({
            logsetName: 'Security Logs',
            from: 'not-a-date',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Invalid datetime format');
    });

    it('should return error when both from and to are invalid', async () => {
        const result = await queryRapid7LogsetByName({
            logsetName: 'Security Logs',
            from: 'invalid-start',
            to: 'invalid-end',
            perPage: 100
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
        const {queryRapid7LogsetByName} = await import('../mcp-server.js');

        const result = await queryRapid7LogsetByName({
            logsetName: 'Security Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Environment variable RAPID7_API_KEY is not set');
    });

    it('should return error content when fetch fails (network error)', async () => {
        fetch.mockRejectedValue(new Error('Connection refused'));

        const result = await queryRapid7LogsetByName({
            logsetName: 'Security Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Connection refused');
    });

    it('should handle unexpected response format', async () => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            headers: new Map([['content-type', 'text/xml']]),
            text: jest.fn().mockResolvedValue('<xml>Not JSON</xml>')
        });

        const result = await queryRapid7LogsetByName({
            logsetName: 'Security Logs',
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 100
        });

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Unexpected response format');
    });

    it('should handle logset name with spaces properly', async () => {
        const logsetName = 'Web Access Logs';
        
        await queryRapid7LogsetByName({
            logsetName,
            from: '2023-01-01T00:00:00Z',
            to: '2023-01-01T23:59:59Z',
            perPage: 25
        });

        expect(fetch.mock.calls).to.have.lengthOf(1);
        const [url] = fetch.mock.calls[0];
        expect(url).to.include(`logset_name=Web+Access+Logs`);
        expect(url).to.include('per_page=25');
    });
});
