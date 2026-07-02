import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { vi } from "vitest";
import testPrisma from "./setup.js";

// Mock the prisma singleton to use the test client
vi.mock("../../lib/prisma.js", () => ({
	default: testPrisma,
}));

// Import app AFTER mocking prisma
const { default: app } = await import("../../app.js");
import request from "supertest";

describe("Task API E2E Tests", () => {
	beforeEach(async () => {
		// Clean up database between tests
		await testPrisma.task.deleteMany();
	});

	afterAll(async () => {
		await testPrisma.$disconnect();
	});

	describe("POST /api/tasks", () => {
		it("should create a new task", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "E2E Task", description: "E2E Description" });

			expect(res.status).toBe(201);
			expect(res.body).toHaveProperty("id");
			expect(res.body.title).toBe("E2E Task");
			expect(res.body.description).toBe("E2E Description");
			expect(res.body.completed).toBe(false);
		});

		it("should reject an empty title", async () => {
			const res = await request(app)
				.post("/api/tasks")
				.send({ title: "   ", description: "Invalid" });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({
				error: "Title is required and must be a non-empty string",
			});
		});
	});

	describe("GET /api/tasks", () => {
		it("should return all tasks", async () => {
			await testPrisma.task.create({
				data: { title: "First task", description: "One" },
			});
			await testPrisma.task.create({
				data: { title: "Second task", description: "Two" },
			});

			const res = await request(app).get("/api/tasks");

			expect(res.status).toBe(200);
			expect(res.body).toHaveLength(2);
			expect(res.body[0].title).toBe("Second task");
			expect(res.body[1].title).toBe("First task");
		});
	});

	describe("GET /api/tasks/:id", () => {
		it("should return a task by id", async () => {
			const createdTask = await testPrisma.task.create({
				data: { title: "Task to fetch", description: "Lookup" },
			});

			const res = await request(app).get(`/api/tasks/${createdTask.id}`);

			expect(res.status).toBe(200);
			expect(res.body.id).toBe(createdTask.id);
			expect(res.body.title).toBe("Task to fetch");
		});

		it("should return 400 for an invalid task id", async () => {
			const res = await request(app).get("/api/tasks/abc");

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid task ID" });
		});

		it("should return 404 for a missing task", async () => {
			const res = await request(app).get("/api/tasks/9999");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});

	describe("PUT /api/tasks/:id", () => {
		it("should update an existing task", async () => {
			const createdTask = await testPrisma.task.create({
				data: { title: "Task to update", description: "Before" },
			});

			const res = await request(app)
				.put(`/api/tasks/${createdTask.id}`)
				.send({ title: "Updated task", description: "After", completed: true });

			expect(res.status).toBe(200);
			expect(res.body.id).toBe(createdTask.id);
			expect(res.body.title).toBe("Updated task");
			expect(res.body.description).toBe("After");
			expect(res.body.completed).toBe(true);
		});

		it("should return 400 for an invalid task id", async () => {
			const res = await request(app)
				.put("/api/tasks/abc")
				.send({ completed: true });

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid task ID" });
		});

		it("should return 404 when updating a missing task", async () => {
			const res = await request(app)
				.put("/api/tasks/9999")
				.send({ completed: true });

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});

	describe("DELETE /api/tasks/:id", () => {
		it("should delete an existing task", async () => {
			const createdTask = await testPrisma.task.create({
				data: { title: "Task to delete", description: "Soon gone" },
			});

			const res = await request(app).delete(`/api/tasks/${createdTask.id}`);

			expect(res.status).toBe(204);
			expect(res.body).toEqual({});

			const deletedTask = await testPrisma.task.findUnique({
				where: { id: createdTask.id },
			});
			expect(deletedTask).toBeNull();
		});

		it("should return 400 for an invalid task id", async () => {
			const res = await request(app).delete("/api/tasks/abc");

			expect(res.status).toBe(400);
			expect(res.body).toEqual({ error: "Invalid task ID" });
		});

		it("should return 404 when deleting a missing task", async () => {
			const res = await request(app).delete("/api/tasks/9999");

			expect(res.status).toBe(404);
			expect(res.body).toEqual({ error: "Task not found" });
		});
	});
});
