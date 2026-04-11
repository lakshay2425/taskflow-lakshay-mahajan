import express from 'express';
const router = express.Router();

router.get("/", (req, res) => {
    //List projects the current user owns or has tasks in
    res.status(200).json({
        message: "Project route"
    })
})

router.get("/:id", (req, res) => {
    //Get project details + its tasks
    res.status(200).json({
        message: "Get project by ID route"
    })
});


router.post("/", (req, res) => {
    //Create a project (owner = current user)
    res.status(200).json({
        message: "Create project route"
    })
})

router.patch("/:id", (req, res) => {
    //Update name/description (owner only)
    res.status(200).json({
        message: "Update project route"
    })
});

router.delete("/:id", (req, res) => {
    //Delete project and all its tasks (owner only)
    res.status(200).json({
        message: "Delete project route"
    })
})

router.get("/:id/tasks", (req, res) => {
    //Support ?status and ?assignee filters
    res.status(200).json({
        message: "Get tasks for project route"
    })
});

router.post("/:id/tasks", (req, res) => {
    //Create a task
    res.status(200).json({
        message: "Create task for project route"
    })
})

export default router;
