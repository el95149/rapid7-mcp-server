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
        process.env.RAPID7_API_KEY = mockApiKey;
        process.env.RAPID7_BASE_URL = mockBaseUrl;

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
});
