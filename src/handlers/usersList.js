import { listUsers } from "../services/userService.js";

const TABLE = process.env.USER_TABLE;

export const listUsersHandler = async (event) => {
  try {
    const q = event.queryStringParameters || {};
    const limit = q.limit ? Math.max(1, Math.min(100, parseInt(q.limit, 10))) : 10;
    const nextToken = q.nextToken || null;
    const search = q.search || null;
    const gender = q.gender || null;
    const sort = (q.sort || "ASC").toUpperCase() === "DESC" ? "DESC" : "ASC";

    const result = await listUsers({
      tableName: TABLE,
      limit,
      nextToken,
      search,
      gender,
      sort
    });

    return jsonResponse(200, result);
  } catch (err) {
    console.error("listUsers error:", err);
    return jsonResponse(500, { error: "Internal Server Error", details: err.message });
  }
};

function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
}
