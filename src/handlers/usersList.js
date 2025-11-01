import { listUsers } from "../services/userService.js";
import { bindLogContext } from "../utils/logger.js";

const TABLE = process.env.USER_TABLE;

export const listUsersHandler = async (event) => {
  const log = bindLogContext({ function: "listUsersHandler" });
  log.info("Listing users", { queryParams: event.queryStringParameters });

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
    log.info("Users listed successfully", { result });

    return jsonResponse(200, result);
  } catch (err) {
    log.error("listUsers error:", err);
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
