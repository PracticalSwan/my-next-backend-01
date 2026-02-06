import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const { _id, password, ...updateData } = data;

    const client = await getClientPromise();
    const db = client.db("wad01");

    const result = await db.collection("user").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "User updated", result },
      { status: 200, headers: corsHeaders }
    );
  } catch (exception) {
    console.log("exception", exception.toString());
    return NextResponse.json(
      { message: exception.toString() },
      { status: 400, headers: corsHeaders }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const client = await getClientPromise();
    const db = client.db("wad01");

    const result = await db.collection("user").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { message: "User deleted", result },
      { status: 200, headers: corsHeaders }
    );
  } catch (exception) {
    console.log("exception", exception.toString());
    return NextResponse.json(
      { message: exception.toString() },
      { status: 400, headers: corsHeaders }
    );
  }
}
