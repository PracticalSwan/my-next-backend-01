import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import {
  DB_NAME,
  COLLECTION_USER,
  HTTP_STATUS,
  ERROR_MESSAGES,
} from "@/lib/constants";

export async function OPTIONS(req) {
  return new Response(null, {
    status: HTTP_STATUS.OK,
    headers: corsHeaders,
  });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const client = await getClientPromise();
    const db = client.db(DB_NAME);

    const users = await db
      .collection(COLLECTION_USER)
      .find({}, { projection: { password: 0 } })
      .skip(skip)
      .limit(limit)
      .toArray();
    const total = await db.collection(COLLECTION_USER).countDocuments({});

    return NextResponse.json(
      {
        users,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      {
        headers: corsHeaders,
      }
    );
  } catch (exception) {
    console.error("Get users error:", exception);
    return NextResponse.json(
      { message: exception.message || "Failed to fetch users" },
      { status: HTTP_STATUS.BAD_REQUEST, headers: corsHeaders }
    );
  }
}

export async function POST(req) {
  const data = await req.json();
  const username = data.username;
  const email = data.email;
  const password = data.password;
  const firstname = data.firstname;
  const lastname = data.lastname;

  if (!username || !email || !password) {
    return NextResponse.json(
      {
        message: ERROR_MESSAGES.MISSING_MANDATORY_DATA,
      },
      {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: corsHeaders,
      },
    );
  }

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const result = await db.collection(COLLECTION_USER).insertOne({
      username: username,
      email: email,
      password: await bcrypt.hash(password, 10),
      firstname: firstname,
      lastname: lastname,
      status: "ACTIVE",
    });
    console.log("result", result);
    return NextResponse.json(
      {
        id: result.insertedId,
      },
      {
        status: HTTP_STATUS.OK,
        headers: corsHeaders,
      },
    );
  } catch (exception) {
    console.error("Create user error:", exception);
    const errorMsg = exception.toString();
    let displayErrorMsg = "";
    if (errorMsg.includes("duplicate")) {
      if (errorMsg.includes("username")) {
        displayErrorMsg = ERROR_MESSAGES.DUPLICATE_USERNAME;
      } else if (errorMsg.includes("email")) {
        displayErrorMsg = ERROR_MESSAGES.DUPLICATE_EMAIL;
      }
    }
    return NextResponse.json(
      {
        message: displayErrorMsg,
      },
      {
        status: HTTP_STATUS.BAD_REQUEST,
        headers: corsHeaders,
      },
    );
  }
}
