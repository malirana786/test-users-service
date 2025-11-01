import { getUserByUuid } from "../services/userService.js";

const TABLE = process.env.USER_TABLE;

export const getUser = async (event) => {
  try {
    const uuid = event.pathParameters?.uuid;
    if (!uuid) return jsonResponse(400, { error: "Missing uuid param" });

    const user = await getUserByUuid(TABLE, uuid);
    if (!user) return jsonResponse(404, { error: "User not found" });

    return jsonResponse(200, user);
  } catch (err) {
    console.error("getUser error:", err);
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
