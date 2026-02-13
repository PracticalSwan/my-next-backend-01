import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { DB_NAME, COLLECTION_USER, HTTP_STATUS } from "@/lib/constants";

const TEST_USER = {
  username: "testuser",
  email: "test@example.com",
  password: "password123",
  firstname: "Test",
  lastname: "User",
  status: "ACTIVE",
};

export async function OPTIONS() {
  return new Response(null, {
    status: HTTP_STATUS.OK,
    headers: corsHeaders,
  });
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { message: "Not available in production" },
      { status: HTTP_STATUS.NOT_FOUND, headers: corsHeaders }
    );
  }

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);

    await db.collection(COLLECTION_USER).updateOne(
      { email: TEST_USER.email },
      {
        $set: {
          username: TEST_USER.username,
          email: TEST_USER.email,
          password: hashedPassword,
          firstname: TEST_USER.firstname,
          lastname: TEST_USER.lastname,
          status: TEST_USER.status,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    return NextResponse.json(
      {
        message: "Test user ready",
        email: TEST_USER.email,
      },
      { status: HTTP_STATUS.OK, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Seed test user error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to seed test user" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: corsHeaders }
    );
  }
}
