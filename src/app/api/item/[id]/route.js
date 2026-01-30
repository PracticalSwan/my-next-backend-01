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
        const { _id, ...updateData } = data; // Exclude _id from update payload if present

        const client = await getClientPromise();
        const db = client.db("wad01");

        // Ensure itemPrice is a number if it's being updated
        if (updateData.itemPrice) {
            updateData.itemPrice = parseFloat(updateData.itemPrice);
        }

        const result = await db.collection("item").updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        return NextResponse.json({
            message: "Item updated",
            result
        }, {
            status: 200,
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

export async function DELETE(req, { params }) {
    try {
        const { id } = await params;
        const client = await getClientPromise();
        const db = client.db("wad01");

        const result = await db.collection("item").deleteOne({
            _id: new ObjectId(id)
        });

        return NextResponse.json({
            message: "Item deleted",
            result
        }, {
            status: 200,
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
