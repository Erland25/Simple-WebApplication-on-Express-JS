const express = require('express');
const app = express();
const fs = require("fs");
//const urlencodedParser = express.urlencoded({extended: false})
const jsonParser = express.json();
const jsonPath = "users.json";
//app.use(express.static(__dirname + "/public"));

app.use(function (req, resp, next) {
    let now = new Date();
    let hour = now.getHours();
    let minutes = now.getMinutes();
    let seconds = now.getSeconds();
    let data = `${now}:${hour}:${minutes}:${seconds}
    Address: ${req.url}
    HTTP-method: ${req.method}
    Browser: ${req.get("user-agent")}`;
    console.log(data);
    fs.appendFile("server.log", data, function () {
    });
    next();
});
// Методы отдачи гипертекста
app.get("/", function (request, response) {
    response.status(200).sendFile(__dirname + "/html/main.html");
});
app.get("/api/users", function (request, response) {
    response.status(200).sendFile(__dirname + "/html/findUser.html");
});
app.get("/api/register", function (req, resp) {
    resp.sendFile(__dirname + "/html/register.html");
});
app.get("/api/updateUser", function (req, resp) {
    resp.sendFile(__dirname + "/html/update.html")
});
app.get("/api/deleteUser", function (req, resp) {
    resp.sendFile(__dirname + "/html/deleteUser.html")
});
// Основная бизнес-логика
app.get("/api/users/:id", function (req, resp) {
    const paramID = req.params.id;
    if (paramID > -1) {
        const users = getUsersFromJson();
        let user = findUserById(req, resp, users, paramID);
        resp.status(201).send(user);
    } else {
        resp.status(400).send("Вы указали некорректный id");
    }
});
app.post("/api/register", jsonParser, function (req, resp) {
    if (!req.body || !req.body.name || !req.body.age || typeof req.body.name !== 'string' || typeof req.body.age !== 'number') {
        resp.status(400).send("Вы указали неверные данные при регистрации");
    }
    const userName = req.body.name;
    const userAge = req.body.age;
    let content = fs.readFileSync(jsonPath, "utf8");
    let users = JSON.parse(content);
    checkUserNameExists(resp, users, userName);
    let maxId = 0;
    users.map(function (user) {
        if (user.id > maxId) {
            maxId = user.id;
        }
    });
    const ourId = maxId + 1;
    let user = {id: ourId, name: userName, age: userAge};
    users.push(user);
    let data = JSON.stringify(users);
    fs.writeFileSync(jsonPath, data);
    let logText = `Пользователь записан\n${JSON.stringify(user)}`;
    fs.appendFile("users_list.log", logText, function () {
    });
    resp.status(201).send(user);
});
app.put("/api/updateUser", jsonParser, function (req, resp) {
    let userID = req.body.id;
    if (userID < 0) {
        resp.status(400).send("Некорректный формат id");
    }
    let userName = req.body.name;
    let userAge = req.body.age;
    let users = getUsersFromJson();
    if (!req.body) {
        resp.status(400).send("Вы не указали данные для изменения");
    }
    let user = deleteUser(users, userID)
    user.name = userName;
    user.age = userAge;
    users.push(user);
    let data = JSON.stringify(users);
    fs.writeFileSync(jsonPath, data);
    let logText = `Пользователь c id=${userID} изменил данные \n${JSON.stringify(user)}`;
    fs.appendFile("users_list.log", logText, function () {
    });
    resp.status(201).send(user);
});
app.delete("/api/deleteUser/:id", function (req, resp) {
    const paramID = req.params.id;
    if (paramID > -1) {
        let users = getUsersFromJson();
        let user = deleteUser(users, paramID);
        if (!user) {
            resp.status(404).send(`User with id=${paramID} wasn't found`)
        }
        let data = JSON.stringify(users);
        fs.writeFileSync(jsonPath, data);
        resp.status(201).send(user);
    } else {
        resp.status(400).send("Вы указали некорректный id");
    }
});

function checkUserNameExists(resp, users, userName) {
    for (let i = 0; i < users.length; i++) {
        if (users[i].name == userName) {
            resp.status(400).send("Пользователь с таким именем уже существует");
            break;
        }
    }
}

function deleteUser(users, paramID) {
    let user = null;
    for (let i = 0; i < users.length; i++) {
        if (users[i].id == paramID) {
            user = users[i];
            users.splice(i, 1);
            break;
        }
    }
    return user;
}

function findUserById(req, resp, users, paramID) {
    let user = null;
    for (let i = 0; i < users.length; i++) {
        if (users[i].id == paramID) {
            user = users[i];
            break;
        }
    }
    if (!user) {
        resp.status(404).send(`User with id=${paramID} wasn't found`)
    } else {
        return user;
    }
}

function getUsersFromJson() {
    let content = fs.readFileSync(jsonPath, "utf8");
    let users = JSON.parse(content);
    return users;
}

app.listen(3000, '0.0.0.0', () => console.log("Сервер запущен..."));
