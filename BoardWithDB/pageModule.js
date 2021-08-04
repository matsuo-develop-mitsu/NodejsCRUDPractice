const fs = require("fs");

const index_page = fs.readFileSync("./index.ejs", "utf8");
const list_page = fs.readFileSync("./list.ejs", "utf8");
const addUser_page = fs.readFileSync("./addUser.ejs", "utf8");
const updateUser_page = fs.readFileSync("./updateUser.ejs", "utf8");

module.exports = { index_page, list_page, addUser_page, updateUser_page };
