import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../utils/dynamo.js";

/**
 * Get single user by uuid (Query on PK)
 */
export const getUserByUuid = async (tableName, uuid) => {
  const cmd = new QueryCommand({
     TableName: tableName,
    KeyConditionExpression: "#uuid = :u",
    ExpressionAttributeNames: {
      "#uuid": "uuid"
    },
    ExpressionAttributeValues: {
      ":u": uuid
    },
    Limit: 1
  });

  const res = await docClient.send(cmd);
  return res.Items?.[0] ?? null;
};

/**
 * List / search users (Query-only using fullNameIndex)
 * - search: prefix match on fullName (optional)
 * - gender: optional FilterExpression (applied server-side after Query)
 * - limit: page size
 * - nextToken: base64'ed LastEvaluatedKey returned from previous response
 * - sort: "ASC" or "DESC" on fullName (ScanIndexForward)
 */
export const listUsers = async ({ tableName, limit = 10, nextToken, search, gender, sort = "ASC" }) => {
  const ExclusiveStartKey = nextToken
    ? JSON.parse(Buffer.from(nextToken, "base64").toString("utf8"))
    : undefined;

  let KeyConditionExpression = "entity = :ent";
  const ExpressionAttributeValues = { ":ent": "USER" };

  if (search) {
    KeyConditionExpression = "entity = :ent AND begins_with(fullName, :prefix)";
    ExpressionAttributeValues[":prefix"] = search;
  }

  let FilterExpression;
  if (gender) {
    FilterExpression = "gender = :g";
    ExpressionAttributeValues[":g"] = gender;
  }

  const params = {
    TableName: tableName,
    IndexName: "fullNameIndex",
    KeyConditionExpression,
    ExpressionAttributeValues,
    Limit: limit,
    ExclusiveStartKey,
    ScanIndexForward: sort === "ASC"
  };

  if (FilterExpression) params.FilterExpression = FilterExpression;

  const cmd = new QueryCommand(params);
  const res = await docClient.send(cmd);

  return {
    items: res.Items || [],
    nextToken: res.LastEvaluatedKey ? Buffer.from(JSON.stringify(res.LastEvaluatedKey)).toString("base64") : null
  };
};
