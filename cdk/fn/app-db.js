
// can't use export const in Lambda, no ES module support yet.
exports.appDbApi = async (event, context) => {
  return { statusCode: 200, body: JSON.stringify({ hello: "world" }) };
};
