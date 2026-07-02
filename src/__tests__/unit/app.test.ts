import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedControllers = {
	getAllTasks: vi.fn((_req, res) => res.status(200).json([{ id: 1, title: "all" }])),
	getTaskById: vi.fn((req, res) => res.status(200).json({ id: Number(req.params.id) })),
	createTask: vi.fn((req, res) => res.status(201).json(req.body)),
	updateTask: vi.fn((req, res) =>
		res.status(200).json({ id: Number(req.params.id), ...req.body })
	),
	deleteTask: vi.fn((_req, res) => res.status(204).send()),
};

vi.mock("../../controllers/task.controller.js", () => mockedControllers);

const { default: app } = await import("../../app.js");

describe("app routes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("wires GET /api/tasks to getAllTasks", async () => {
		const res = await request(app).get("/api/tasks");

		expect(res.status).toBe(200);
		expect(res.body).toEqual([{ id: 1, title: "all" }]);
		expect(mockedControllers.getAllTasks).toHaveBeenCalledTimes(1);
	});

	it("wires GET /api/tasks/:id to getTaskById", async () => {
		const res = await request(app).get("/api/tasks/42");

		expect(res.status).toBe(200);
		expect(res.body).toEqual({ id: 42 });
		expect(mockedControllers.getTaskById).toHaveBeenCalledTimes(1);
	});

	it("wires POST /api/tasks to createTask with parsed json", async () => {
		const payload = { title: "Created", description: "From app test" };
		const res = await request(app).post("/api/tasks").send(payload);

		expect(res.status).toBe(201);
		expect(res.body).toEqual(payload);
		expect(mockedControllers.createTask).toHaveBeenCalledTimes(1);
	});

	it("wires PUT /api/tasks/:id to updateTask", async () => {
		const res = await request(app)
			.put("/api/tasks/7")
			.send({ completed: true });

		expect(res.status).toBe(200);
		expect(res.body).toEqual({ id: 7, completed: true });
		expect(mockedControllers.updateTask).toHaveBeenCalledTimes(1);
	});

	it("wires DELETE /api/tasks/:id to deleteTask", async () => {
		const res = await request(app).delete("/api/tasks/9");

		expect(res.status).toBe(204);
		expect(mockedControllers.deleteTask).toHaveBeenCalledTimes(1);
	});
});