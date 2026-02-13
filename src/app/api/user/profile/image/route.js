import { verifyJWT } from "@/lib/auth";
import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import {
  DB_NAME,
  COLLECTION_USER,
  ALLOWED_IMAGE_TYPES,
  PROFILE_IMAGES_DIR,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "@/lib/constants";

const IMAGE_EXTENSION_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// Helper to parse multipart form data (works in Node.js API routes)
async function parseMultipartFormData(req) {
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.startsWith("multipart/form-data")) {
    throw new Error(ERROR_MESSAGES.INVALID_CONTENT_TYPE);
  }
  // Use undici's FormData parser (Node 18+)
  const formData = await req.formData();
  return formData;
}

export async function POST(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.UNAUTHORIZED },
      { status: HTTP_STATUS.UNAUTHORIZED, headers: corsHeaders }
    );
  }

  let formData;

  try {
    formData = await parseMultipartFormData(req);
  } catch (err) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.INVALID_FORM_DATA },
      { status: HTTP_STATUS.BAD_REQUEST, headers: corsHeaders }
    );
  }

  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json(
      { message: ERROR_MESSAGES.NO_FILE_UPLOADED },
      { status: HTTP_STATUS.BAD_REQUEST, headers: corsHeaders }
    );
  }

  // Check if file is an image
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.ONLY_IMAGE_ALLOWED },
      { status: HTTP_STATUS.BAD_REQUEST, headers: corsHeaders }
    );
  }

  const uploadDirectoryPath = path.join(process.cwd(), "public", PROFILE_IMAGES_DIR);
  await fs.mkdir(uploadDirectoryPath, { recursive: true });

  const ext = IMAGE_EXTENSION_BY_TYPE[file.type];
  const filename = `${crypto.randomUUID()}-${crypto.randomBytes(8).toString("hex")}.${ext}`;
  const savePath = path.join(uploadDirectoryPath, filename);

  // Save file to disk
  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(savePath, Buffer.from(arrayBuffer));

  // Update user in MongoDB
  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    await db.collection(COLLECTION_USER).updateOne(
      { email: user.email },
      { $set: { profileImage: `/${PROFILE_IMAGES_DIR}/${filename}` } }
    );
  } catch (err) {
    console.error("Upload image error:", err);
    return NextResponse.json(
      { message: ERROR_MESSAGES.FAILED_UPDATE_USER },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: corsHeaders }
    );
  }
  return NextResponse.json(
    { imageUrl: `/${PROFILE_IMAGES_DIR}/${filename}` },
    { status: HTTP_STATUS.OK, headers: corsHeaders }
  );
}

export async function DELETE(req) {
  const user = verifyJWT(req);
  if (!user) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.UNAUTHORIZED },
      { status: HTTP_STATUS.UNAUTHORIZED, headers: corsHeaders }
    );
  }

  try {
    const client = await getClientPromise();
    const db = client.db(DB_NAME);
    const email = user.email;
    const profile = await db.collection(COLLECTION_USER).findOne({ email });
    if (profile && profile.profileImage) {
      const relativeImagePath = profile.profileImage.replace(/^\/+/, "");
      const filePath = path.join(process.cwd(), "public", relativeImagePath);
      try {
        await fs.rm(filePath);
      } catch (err) {
        // File might not exist, ignore and continue
        console.warn("File not found on disk:", profile.profileImage);
      }
      await db.collection(COLLECTION_USER).updateOne(
        { email },
        { $set: { profileImage: null } }
      );
    }
    return NextResponse.json(
      { message: SUCCESS_MESSAGES.OK },
      { status: HTTP_STATUS.OK, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Delete profile image error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete profile image" },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: corsHeaders }
    );
  }
}
