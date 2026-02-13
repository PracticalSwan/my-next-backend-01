import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import {
  DB_NAME,
  COLLECTION_USER,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "@/lib/constants";

const PROFILE_PROJECTION = {
  password: 0,
  username: 0,
  status: 0,
  updatedAt: 0,
};

function normalizeProfile(profile) {
  return {
    _id: profile?._id ? String(profile._id) : "",
    firstname: profile?.firstname ?? "",
    lastname: profile?.lastname ?? "",
    email: profile?.email ?? "",
    profileImage: profile?.profileImage ?? null,
  };
}

export async function OPTIONS(req) {
  return new Response(null, {
    status: HTTP_STATUS.OK,
    headers: corsHeaders,
  });
}

export async function GET(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.UNAUTHORIZED },
      {
        status: HTTP_STATUS.UNAUTHORIZED,
        headers: corsHeaders
      }
    );
  }

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const email = user.email;
    const profile = await db.collection(COLLECTION_USER).findOne(
      { email },
      { projection: PROFILE_PROJECTION }
    );
    if (!profile) {
      return NextResponse.json(
        { message: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND, headers: corsHeaders }
      );
    }
    return NextResponse.json(normalizeProfile(profile), {
      headers: corsHeaders
    });
  }
  catch(error) {
    console.error("Get Profile Exception:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch profile" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: corsHeaders }
    );
  }
}

export async function PATCH(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.UNAUTHORIZED },
      {
        status: HTTP_STATUS.UNAUTHORIZED,
        headers: corsHeaders
      }
    );
  }

  try {
    const updateData = await req.json();
    const { firstname, lastname } = updateData;

    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const email = user.email;

    // Build update object with only provided fields
    const updateFields = {};

    if (firstname !== undefined) {
      if (typeof firstname !== "string" || firstname.trim() === "") {
        return NextResponse.json(
          { message: "Invalid first name" },
          { status: HTTP_STATUS.BAD_REQUEST, headers: corsHeaders }
        );
      }
      updateFields.firstname = firstname.trim();
    }

    if (lastname !== undefined) {
      if (typeof lastname !== "string" || lastname.trim() === "") {
        return NextResponse.json(
          { message: "Invalid last name" },
          { status: HTTP_STATUS.BAD_REQUEST, headers: corsHeaders }
        );
      }
      updateFields.lastname = lastname.trim();
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { message: "No updatable profile fields provided" },
        { status: HTTP_STATUS.BAD_REQUEST, headers: corsHeaders }
      );
    }

    updateFields.updatedAt = new Date();

    const result = await db.collection(COLLECTION_USER).updateOne(
      { email },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: ERROR_MESSAGES.USER_NOT_FOUND },
        { status: HTTP_STATUS.NOT_FOUND, headers: corsHeaders }
      );
    }

    // Fetch and return updated profile
    const updatedProfile = await db.collection(COLLECTION_USER).findOne(
      { email },
      { projection: PROFILE_PROJECTION }
    );

    return NextResponse.json(
      {
        message: SUCCESS_MESSAGES.PROFILE_UPDATED,
        profile: normalizeProfile(updatedProfile)
      },
      {
        status: HTTP_STATUS.OK,
        headers: corsHeaders
      }
    );
  }
  catch(error) {
    console.error("Update Profile Exception:", error);
    return NextResponse.json(
      { message: ERROR_MESSAGES.FAILED_UPDATE_PROFILE + error.message },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: corsHeaders }
    );
  }
} 