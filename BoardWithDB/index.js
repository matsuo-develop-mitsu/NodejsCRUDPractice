const mysql = require("mysql2");
const http = require("http");
const fs = require("fs");
const ejs = require("ejs");
const url = require("url");
const qs = require("querystring");

const pages = require("./pageModule");

let page;
let registerUser;
let deleteUser;
let updateUser;

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "Node",
  port: "3306",
});

connection.connect((error) => {
  if (error) {
    console.log("error connecting" + error.stack);
  } else {
    console.log("success");
  }
});

// 全ユーザー情報を取得する
async function getAllUser() {
  let users = [];
  await connection
    .promise()
    .query("SELECT * FROM User")
    .then((data) => {
      data[0].forEach((user) => {
        users.push(user);
      });
    });
  return users;
}

// idに紐づいたユーザーを取得する
async function getSingleUser(userId) {
  let user;
  await connection
    .promise()
    .query("SELECT * FROM User WHERE id = ?", [userId])
    .then((data) => {
      user = data[0][0];
    });
  return user;
}

// 更新処理を行う
async function updateUserdata(user) {
  let result;
  await connection
    .promise()
    .query("UPDATE User SET name = ?, mail = ?, age = ? WHERE id = ?", [
      user.name,
      user.mail,
      user.age,
      user.id,
    ])
    .then((data) => {
      result = true;
    })
    .catch((error) => {
      console.log(`UPDATE ERROR ${error.message}`);
      result = false;
    });
  return result;
}

const server = http.createServer((request, response) => {
  const url_parts = url.parse(request.url);

  switch (url_parts.pathname) {
    case "/":
      page = ejs.render(pages.index_page, {
        title: "Index",
        content: "これはインデックスページの物です",
      });
      response.writeHead(200, { "Content-Type": "text/html" });
      response.write(page);
      response.end();
      break;

    case "/list":
      getAllUser().then((data) => {
        page = ejs.render(pages.list_page, {
          title: "List",
          content: data,
        });
        response.writeHead(200, { "Content-Type": "text/html" });
        response.write(page);
        response.end();
      });
      break;

    case "/addUser":
      // ユーザー情報を登録する画面に遷移する
      page = ejs.render(pages.addUser_page, {
        title: "Add",
      });
      response.writeHead(200, { "Content-Type": "text/html" });
      response.write(page);
      response.end();
      break;

    case "/register":
      if (request.method == "POST") {
        request.on("data", (chunk) => {
          registerUser = "";
          registerUser += chunk;
        });
        request.on("end", () => {
          registerUser = qs.parse(registerUser);

          connection.query(
            "INSERT INTO User(name, mail, age) values (?, ?, ?)",
            [registerUser.name, registerUser.mail, registerUser.age],
            (error, result) => {
              if (error) {
                console.log(`Insert Error : ${error.message}`);
              }

              getAllUser().then((data) => {
                page = ejs.render(pages.list_page, {
                  title: "List",
                  content: data,
                });
                response.writeHead(301, {
                  Location: "/list",
                  "Content-Type": "text/html",
                });
                response.write(page);
                response.end();
              });
            }
          );
        });
      }
      break;

    case "/update":
      request.on("data", (data) => {
        updateUser = "";
        updateUser += data;
      });

      request.on("end", () => {
        updateUser = qs.parse(updateUser);
        getSingleUser(updateUser.id).then((data) => {
          page = ejs.render(pages.updateUser_page, {
            title: "Update",
            content: data,
          });
          response.writeHead(200, { "Content-Type": "text/html" });
          response.write(page);
          response.end();
        });
      });
      break;

    case "/updateUser":
      request.on("data", (data) => {
        updateUser = "";
        updateUser += data;
      });

      request.on("end", () => {
        updateUser = qs.parse(updateUser);
        updateUserdata(updateUser).then((result) => {
          getAllUser().then((users) => {
            page = ejs.render(pages.list_page, {
              title: "List",
              content: users,
            });
            response.writeHead(301, {
              Location: "/list",
              "Content-Type": "text/html",
            });
            response.write(page);
            response.end();
          });
        });
      });
      break;

    case "/delete":
      request.on("data", (data) => {
        deleteUser = "";
        deleteUser += data;
      });

      request.on("end", () => {
        deleteUser = qs.parse(deleteUser);

        connection.query(
          "DELETE FROM User WHERE id = ?",
          [deleteUser.id],
          (error, result) => {
            if (!error) {
              getAllUser().then((data) => {
                page = ejs.render(pages.list_page, {
                  title: "List",
                  content: data,
                });
                response.writeHead(200, {
                  Location: "/list",
                  "Content-Type": "text/html",
                });
              });
              response.write(page);
              response.end();
            } else {
              console.log(`Insert Error : ${error.message}`);
            }
          }
        );
      });
      break;

    default:
      response.writeHead(200, { "Content-Type": "text/plain" });
      response.end("404 Not Found...");
      break;
  }
});

server.listen(3000);
