import "dotenv/config";
import s3 from "./config/s3.js";
import { HeadBucketCommand } from "@aws-sdk/client-s3";

try {
    await s3.send(
        new HeadBucketCommand({
            Bucket: process.env.AWS_S3_BUCKET,
        })
    );

    console.log("S3 connection successful");
} catch (error) {
    console.error("S3 connection failed:", error.message);
}