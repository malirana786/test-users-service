import { getUserByUuid } from "../services/userService.js";
import { bindLogContext } from "../utils/logger.js";

const TABLE = process.env.USER_TABLE;

export const getUser = async (event) => {
  const log = bindLogContext({ function: "getUser" });
  try {
    const uuid = event.pathParameters?.uuid;
    if (!uuid) {
      log.warn("Missing uuid param");
      return jsonResponse(400, { error: "Missing uuid param" });
    }
    log.info("Fetching user", { uuid });
    const user = await getUserByUuid(TABLE, uuid);
    if (!user) {
      log.warn("User not found");
      return jsonResponse(404, { error: "User not found" });
    }
    log.info("User fetched successfully", { uuid });
    return jsonResponse(200, user);
  } catch (err) {
    log.error("getUser error:", err);
    return jsonResponse(500, { error: "Internal Server Error", details: err.message });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
