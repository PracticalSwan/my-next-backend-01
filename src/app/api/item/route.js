import corsHeaders from "@/lib/cors";
import { getClientPromise } from "@/lib/mongodb";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function OPTIONS(req) {
  return new Response(null, {
    status: 200,
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
    const db = client.db("wad01");

    const items = await db.collection("item").find({}).skip(skip).limit(limit).toArray();
    const total = await db.collection("item").countDocuments({});

    return NextResponse.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }, {
      headers: corsHeaders
    });
  }
  catch (exception) {
    console.log("exception", exception.toString());
    return NextResponse.json({
      message: exception.toString()
    }, {
      status: 400,
      headers: corsHeaders
    })
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { itemName, itemPrice, itemCategory, status } = data;

    const client = await getClientPromise();
    const db = client.db("wad01");
    const result = await db.collection("item").insertOne({
      itemName,
      itemCategory,
      itemPrice: parseFloat(itemPrice), // Ensure number
      status: status || "ACTIVE"
    });

    return NextResponse.json({
      id: result.insertedId,
      ...data
    }, {
      status: 200,
      headers: corsHeaders
    })
  }
  catch (exception) {
    console.log("exception", exception.toString());
    return NextResponse.json({
      message: exception.toString()
    }, {
      status: 400,
      headers: corsHeaders
    })
  }
} 