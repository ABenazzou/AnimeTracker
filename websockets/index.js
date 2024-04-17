
const express = require('express');
const app = express();
const amqp = require('amqplib');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
app.use(cors);
var db = require('./database.js');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {origin:["http://localhost:5173"], methods: ["GET", "POST"]},
});


const getAnimesList = () => {
    // get the animes that are:
    // Completed and watched ep < total ep
    // Airing and watched ep < current ep
    //return {Airing: [], Completed: []}
    return new Promise((resolve, reject) => {
        var response = {"Airing": [], "Completed": []}

        var sqlCompleted = "SELECT * FROM AnimeTracker WHERE status='Completed' AND current_watched_episode<total_episodes ORDER BY rating DESC";
        db.all(sqlCompleted, [], (err, rows)=> {
            if (err) {
                reject(err);
                return;
            }
            response["Completed"] = rows;
            var sqlAiring = "SELECT * FROM AnimeTracker WHERE status='Airing' AND current_watched_episode<current_episode ORDER BY rating DESC";
            db.all(sqlAiring, [], (err, rows)=> {
                if (err) {
                    reject(err);
                    return;
                }
                response["Airing"] = rows;
                resolve(response);
            });
        });
    })
    

    
}


// speedrun backend with dirty sqlite
io.on("connection", (socket) => {
    console.log(`a user connected ${socket.id}`);
    
    // rabbitmq updates -> perform operations -> send updates to react
    amqp.connect('amqp://localhost')
    .then((connection) => connection.createChannel())
    .then((channel) => {
    channel.consume('delta_channel', (message) => {
        console.log("Received Message from rabbitmq: ", message.content.toString());
        // parse the json string
        var updates = JSON.parse(message.content.toString());
        updates.UPSERT.forEach((update) => {
            // upsert data
            var sql = `INSERT INTO AnimeTracker(name, thumbnail, total_episodes, current_episode, current_watched_episode, rating, status) VALUES(?, ?, ?, ?, ?, ?, ?)ON CONFLICT(name)
            DO UPDATE SET total_episodes=?, current_episode=?, current_watched_episode=?, rating=?, status=?`;
            var params = [update["name"], update["thumbnail"], update["total episodes"], update["Current Episode"], update["Current Watched Episode"], update["Rating"], update["Status"],
             update["total episodes"], update["Current Episode"], update["Current Watched Episode"], update["Rating"], update["Status"]];

            db.run(sql, params, (err, res) => {
                if (err) {
                    console.log("Failed to update");
                }
                else {
                    console.log("Updated sqlite db succesfully");
                }
            });

        })
        updates.REMOVE.forEach((update) => {
            // remove data
            var sql = `DELETE FROM AnimeTracker WHERE name=?`
            var params = [update["name"]];

            db.run(sql, params, (err, res) => {
                if (err) {
                    console.log("Failed to update");
                }
                else {
                    console.log("Updated sqlite db succesfully");
                }
            });

        })
        
        getAnimesList()
         .then(updatedAnimes => {
            // console.log(updatedAnimes);
            socket.emit("receive-anime-updates", updatedAnimes)
         })
         .catch(error => {
            console.error(error);
         });

        }, { noAck: true });
    })
    .catch((error) => {
    console.error('Error connecting to RabbitMQ', error);
    });

    socket.on("get-animes-list", (data) => {
        // retrieve from sqlite db
        console.log("Called Endpoint to retrieve data first render");
        getAnimesList()
         .then(updatedAnimes => {
            // console.log(updatedAnimes);
            socket.emit("receive-anime-updates", updatedAnimes)
         })
         .catch(error => {
            console.error(error);
         });
        
    });

});

server.listen(4000, () => { console.log("Server Started on Port 4000"); });
