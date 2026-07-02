import { describe, expect, it, vi } from "vitest";

const prismaInstance = { task: { findMany: vi.fn() } };
const prismaClientMock = vi.fn(() => prismaInstance);

vi.mock("@prisma/client", () => ({
	PrismaClient: prismaClientMock,
}));

const { default: prisma } = await import("../../lib/prisma.js");

describe("prisma singleton", () => {
	it("creates and exports one PrismaClient instance", () => {
		expect(prismaClientMock).toHaveBeenCalledTimes(1);
		expect(prisma).toBe(prismaInstance);
	});
});