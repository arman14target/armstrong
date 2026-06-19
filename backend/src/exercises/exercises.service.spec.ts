import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ExercisesService } from "./exercises.service";

function makeService(cloudinaryConfigured = true) {
  const prisma = {
    exercise: { findUnique: jest.fn() },
    exerciseMedia: {
      findFirst: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
    },
  };
  const cloudinary = {
    isConfigured: jest.fn().mockReturnValue(cloudinaryConfigured),
    upload: jest.fn(),
    destroy: jest.fn(),
  };
  const service = new ExercisesService(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    prisma as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cloudinary as any,
  );
  return { service, prisma, cloudinary };
}

const imageFile = { buffer: Buffer.from("x"), mimetype: "image/png", size: 1 };

describe("ExercisesService.addMedia", () => {
  it("rejects when Cloudinary is not configured", async () => {
    const { service } = makeService(false);
    await expect(service.addMedia("e1", imageFile)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects non-image/video files", async () => {
    const { service } = makeService(true);
    await expect(
      service.addMedia("e1", {
        buffer: Buffer.from("x"),
        mimetype: "application/pdf",
        size: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("uploads and stores media for a valid image", async () => {
    const { service, prisma, cloudinary } = makeService(true);
    prisma.exercise.findUnique.mockResolvedValue({ id: "e1", slug: "bench" });
    cloudinary.upload.mockResolvedValue({
      url: "https://cdn/x.png",
      publicId: "armstrong/exercises/bench/x",
      resourceType: "image",
    });
    prisma.exerciseMedia.aggregate.mockResolvedValue({ _max: { position: 1 } });
    prisma.exerciseMedia.create.mockResolvedValue({ id: "m1" });

    await service.addMedia("e1", imageFile);

    expect(cloudinary.upload).toHaveBeenCalled();
    expect(prisma.exerciseMedia.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ position: 2, source: "upload" }),
      }),
    );
  });
});

describe("ExercisesService.deleteMedia", () => {
  it("throws when media is missing", async () => {
    const { service, prisma } = makeService();
    prisma.exerciseMedia.findFirst.mockResolvedValue(null);
    await expect(service.deleteMedia("e1", "m1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("destroys the Cloudinary asset before deleting the row", async () => {
    const { service, prisma, cloudinary } = makeService();
    prisma.exerciseMedia.findFirst.mockResolvedValue({
      id: "m1",
      cloudinaryId: "pub/id",
      type: "IMAGE",
    });
    prisma.exerciseMedia.delete.mockResolvedValue({});
    await service.deleteMedia("e1", "m1");
    expect(cloudinary.destroy).toHaveBeenCalledWith("pub/id", false);
    expect(prisma.exerciseMedia.delete).toHaveBeenCalled();
  });
});
