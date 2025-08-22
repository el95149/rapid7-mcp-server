/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    globals: {
        'ts-jest': {
            useESM: true
        }
    },
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(chai|node-fetch)/)'
    ],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    moduleFileExtensions: ['js', 'json'],
};
