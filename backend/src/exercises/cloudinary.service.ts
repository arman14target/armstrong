import { Injectable, Logger } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";

export interface UploadedMedia {
  url: string;
  publicId: string;
  resourceType: "image" | "video";
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);
  private configured = false;

  constructor() {
    const {
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET,
    } = process.env;
    if (
      CLOUDINARY_CLOUD_NAME &&
      CLOUDINARY_API_KEY &&
      CLOUDINARY_API_SECRET
    ) {
      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true,
      });
      this.configured = true;
    } else {
      this.logger.warn(
        "Cloudinary is not configured — media uploads are disabled.",
      );
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async upload(
    buffer: Buffer,
    mimetype: string,
    folder: string,
  ): Promise<UploadedMedia> {
    const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;
    const res = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: "auto",
      overwrite: false,
    });
    return {
      url: res.secure_url,
      publicId: res.public_id,
      resourceType: res.resource_type === "video" ? "video" : "image",
    };
  }

  async destroy(publicId: string, isVideo: boolean): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: isVideo ? "video" : "image",
      });
    } catch (err) {
      // Don't block DB cleanup if the asset is already gone.
      this.logger.warn(`Failed to delete Cloudinary asset ${publicId}: ${err}`);
    }
  }
}
