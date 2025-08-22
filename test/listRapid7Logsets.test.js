import {expect} from 'chai';
import {jest} from '@jest/globals';

// Set up the mock before importing the module under test
jest.unstable_mockModule('node-fetch', () => ({
    default: jest.fn()
}));

// Import after setting up mocks
const {listRapid7Logsets} = await import('../mcp-server.js');
const {default: fetch} = await import('node-fetch');

describe('listRapid7Logsets', () => {
    const mockApiKey = 'testKey';
    const mockBaseUrl = 'https://eu.rest.logs.insight.rapid7.com';

    beforeEach(() => {
        // Set environment variables
        process.env.RAPID7_API_KEY = mockApiKey;
        process.env.RAPID7_BASE_URL = mockBaseUrl;

        // Set up default successful mock
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({
                logsets: [
                    {id: '123', name: 'Security Logs', description: 'Security-related events'},
                    {id: '456', name: 'Network Logs', description: 'Network traffic data'}
                ]
            }),
            text: jest.fn().mockResolvedValue('{"logsets":[{"id":"123","name":"Security Logs","description":"Security-related events"},{"id":"456","name":"Network Logs","description":"Network traffic data"}]}'),
            headers: new Map([['content-type', 'application/json']])
        });
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should return logsets data when API call succeeds', async () => {
        const result = await listRapid7Logsets();

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem).to.have.property('mimeType', 'application/json');

        const parsedData = JSON.parse(contentItem.text);
        expect(parsedData).to.deep.equal({
            logsets: [
                {id: '123', name: 'Security Logs', description: 'Security-related events'},
                {id: '456', name: 'Network Logs', description: 'Network traffic data'}
            ]
        });
    });

    it('should return error content when API returns 401 Unauthorized', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 401,
            statusText: 'Unauthorized',
            json: jest.fn().mockResolvedValue({ error: 'Invalid API key' }),
            text: jest.fn().mockResolvedValue('{"error":"Invalid API key"}')
        });

        const result = await listRapid7Logsets();

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('API request failed: 401 Unauthorized');
    });

    it('should return error content when API returns 500 Internal Server Error', async () => {
        fetch.mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: jest.fn().mockResolvedValue({ error: 'Server error' }),
            text: jest.fn().mockResolvedValue('{"error":"Server error"}')
        });

        const result = await listRapid7Logsets();

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('API request failed: 500 Internal Server Error');
    });

    it('should return empty content when logsets array is empty', async () => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({ logsets: [] }),
            text: jest.fn().mockResolvedValue('{"logsets":[]}'),
            headers: new Map([['content-type', 'application/json']])
        });

        const result = await listRapid7Logsets();

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem).to.have.property('mimeType', 'application/json');

        const parsedData = JSON.parse(contentItem.text);
        expect(parsedData).to.deep.equal({ logsets: [] });
    });

    it('should handle malformed API response (missing logsets)', async () => {
        fetch.mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({}),
            text: jest.fn().mockResolvedValue('{}'),
            headers: new Map([['content-type', 'application/json']])
        });

        const result = await listRapid7Logsets();

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem).to.have.property('mimeType', 'application/json');

        const parsedData = JSON.parse(contentItem.text);
        expect(parsedData).to.deep.equal({});
    });

    it('should return error content when fetch fails (network error)', async () => {
        fetch.mockRejectedValue(new Error('Network error'));

        const result = await listRapid7Logsets();

        expect(result).to.have.property('content').that.is.an('array').with.lengthOf(1);
        const contentItem = result.content[0];
        expect(contentItem).to.have.property('type', 'text');
        expect(contentItem.text).to.include('Network error');
    });
});
