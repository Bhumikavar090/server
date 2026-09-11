const express = require("express");

const Project = require("../models/Project");

const router = express.Router();


// CREATE PROJECT

router.post("/", async (req, res) => {
  try {
    const {
      name,
      description,
      techStack,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      name,
      description: description || "",
      techStack: Array.isArray(techStack)
        ? techStack
        : [],
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error(
      "Project creation failed:",
      error.message
    );

    res.status(500).json({
      message: "Failed to create project",
    });
  }
});


// GET ALL PROJECTS

router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({
      createdAt: -1,
    });

    res.status(200).json(projects);
  } catch (error) {
    console.error(
      "Project fetch failed:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch projects",
    });
  }
});


// GET SINGLE PROJECT

router.get("/:id", async (req, res) => {
  try {
    const project = await Project.findById(
      req.params.id
    );

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    res.status(200).json(project);
  } catch (error) {
    console.error(
      "Project fetch failed:",
      error.message
    );

    res.status(500).json({
      message: "Failed to fetch project",
    });
  }
});


module.exports = router;