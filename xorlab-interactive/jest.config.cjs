module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/*.spec.ts"],
    testPathIgnorePatterns: ["<rootDir>/dist/"],
    moduleFileExtensions: ["ts", "js", "json"],
    moduleNameMapper: {
        "^uuid$": "<rootDir>/../node_modules/uuid/dist/index.js",
    },
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                tsconfig: "<rootDir>/tsconfig.spec.json",
            },
        ],
    },
};
