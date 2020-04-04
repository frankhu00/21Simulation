module.exports = {
    setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
    snapshotSerializers: ['enzyme-to-json/serializer'],
    testPathIgnorePatterns: ['/node_modules/', '/app/dist'],
    moduleNameMapper: {
        '~src/(.*)': '<rootDir>/app/src/$1',
        '~model/(.*)': '<rootDir>/app/src/model/$1',
        '~ui/(.*)': '<rootDir>/app/src/ui/$1',
        '~page/(.*)': '<rootDir>/app/src/ui/page/$1',
        '~css/(.*)': '<rootDir>/app/src/css/$1',
    },
};
