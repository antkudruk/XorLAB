module.exports = {
  default: {
    paths: ["features/**/*.feature"],
    require: ["src/steps/**/*.ts"],
    requireModule: ["tsx/cjs"],
    format: ["progress"],
  },
};
