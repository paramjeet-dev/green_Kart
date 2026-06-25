const express = require("express");
const router = express.Router();
const { getMessages, sendMessage, getConversations } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");
const { validateMessage, handleValidation, sanitiseBody } = require("../middleware/validate");

router.use(protect);

router.get("/conversations",       getConversations);
router.get("/:listingId/:userId",  getMessages);
router.post("/", sanitiseBody, validateMessage, handleValidation, sendMessage);

module.exports = router;
