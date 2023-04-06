const { request, response, Router } = require ("express");
const languageController = require ("./../controllers/language.controller");

const router = Router();

router.get("/", languageController.getLanguages);
router.get("/:id", languageController.getLanguage);
router.post("/", languageController.addLanguage);
router.delete("/:id", languageController.deleteLanguage);
router.put("/:id", languageController.updateLanguage);

module.exports = router;