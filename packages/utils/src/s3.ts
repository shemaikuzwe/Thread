import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { File } from "buffer";
import { fileTypeFromBuffer } from "file-type";
import { customAlphabet } from "nanoid";
import path from "path";
import { env } from "./env";

export enum StorageBucket {
  ATTACHMENTS = "attachments",
  PROFILES = "profiles",
  MEDIA = "media",
}
export interface FileMetaData {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

type FileUpload = {
  buffer?: Buffer;
  mimeType?: string;
  filename?: string;
};

interface StorageServiceInterface {
  uploadFile(
    file: unknown,
    options?: { bucket: StorageBucket; customName?: string; orgId?: string },
  ): Promise<FileMetaData>;
  deleteFile(key: string): Promise<void>;
}

/**
 * StorageService provides S3-compatible file upload and deletion.
 *
 * @example
 * const storage = new StorageService();
 * const meta = await storage.uploadFile(buffer, {
 *   bucket: StorageBucket.ATTACHMENTS,
 *   customName: "photo",
 * });
 */
class StorageService implements StorageServiceInterface {
  private nanoid: (size?: number) => string;
  private s3Client: S3Client;

  constructor() {
    this.nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10);
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
      },
      region:env.REGION,
      endpoint: env.S3_ENDPOINT,
    });
  }

  async uploadFile(
    file: string | Buffer | File | ArrayBufferLike,
    options?: { bucket: StorageBucket; customName?: string; chatId?: string },
  ): Promise<FileMetaData> {
    try {
      const fileUpload: FileUpload = {};
      const maxFileSize = 100 * 1024 * 1024;

      if (typeof file === "string") {
        const randomName = this.nanoid();
        const fileBuffer = Buffer.from(file, "base64");
        if (fileBuffer.length > maxFileSize) {
          throw new StorageError("file too large", "FILE_TOO_LARGE");
        }
        const fileType = await fileTypeFromBuffer(fileBuffer);
        if (!fileType) {
          throw new StorageError("Invalid file type", "INVALID_FILE_TYPE");
        }
        const fileName = `${options?.customName || randomName}.${fileType.ext}`;
        fileUpload.buffer = fileBuffer;
        fileUpload.mimeType = fileType.mime;
        fileUpload.filename = fileName;
      } else if (file instanceof File) {
        if (file.size > maxFileSize) {
          throw new StorageError("file too large", "FILE_TOO_LARGE");
        }
        const randomName = this.nanoid(4);
        const originalName = file.name;
        const extension = path.extname(originalName);
        const baseName = path.basename(originalName, extension);
        const newName = `${options?.customName || baseName}(${randomName})${extension}`;

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        fileUpload.buffer = fileBuffer;
        fileUpload.mimeType = file.type;
        fileUpload.filename = newName;
      } else if (file instanceof Buffer) {
        if (file.length > maxFileSize) {
          throw new StorageError("file too large", "FILE_TOO_LARGE");
        }
        const randomName = this.nanoid();
        const fileType = await fileTypeFromBuffer(file);
        if (!fileType) {
          throw new StorageError("Invalid file type", "INVALID_FILE_TYPE");
        }
        const newName = `${options?.customName || randomName}.${fileType.ext}`;
        fileUpload.buffer = file;
        fileUpload.mimeType = fileType.mime;
        fileUpload.filename = newName;
      } else {
        throw new StorageError("Invalid file type", "INVALID_FILE_TYPE");
      }

      const key = options?.chatId
        ? `${options.chatId}/${options?.bucket}/${fileUpload.filename}`
        : `${options?.bucket}/${fileUpload.filename}`;
      const url = `${process.env.STORAGE_URL}/${key}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Key: key,
          Body: fileUpload.buffer,
          ContentType: fileUpload.mimeType,
          Bucket: env.S3_BUCKET,
        }),
      );

      return {
        url,
        filename: fileUpload.filename!,
        size: fileUpload.buffer!.length,
        mimeType: fileUpload.mimeType!,
      };
    } catch (error) {
      if (error instanceof StorageError) {
        throw error;
      }
      throw new StorageError(
        `Failed to upload file: ${error instanceof Error ? error.message : error}`,
        "UPLOAD_FAILED",
      );
    }
  }

  async deleteFile(key: string) {
    await this.s3Client.send(
      new DeleteObjectCommand({
        Key: key,
        Bucket: env.S3_BUCKET,
      }),
    );
  }
}

type ErrorCode =
  | "FILE_NOT_FOUND"
  | "UPLOAD_FAILED"
  | "INVALID_FILE_TYPE"
  | "PERMISSION_DENIED"
  | "FILE_TOO_LARGE";

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
  ) {
    super(message);
    this.name = "StorageError";
    this.code = code;
  }
}

export { StorageService };
