import express from 'express'
const router = express.Router();

router.patch("/:id", (req, res) => {
    //Update title, description, status, priority, assignee, due_date
    res.status(200).json({
        message: "Update task route"
    })
});

router.delete("/:id", (req, res) => {
    //Delete task (project owner or task creator only)
    res.status(200).json({
        message: "Delete task route"
    })
});

export default router;
