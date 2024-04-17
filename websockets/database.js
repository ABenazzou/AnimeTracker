var sqlite3 = require('sqlite3').verbose()


let db = new sqlite3.Database("db.sqlite", (err) => {
    if (err) {
      console.error(err.message)
      throw err
    }else{
        console.log('Connected to the SQLite database.')
        db.run(`CREATE TABLE AnimeTracker (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name text UNIQUE, 
            thumbnail text,
            total_episodes integer,
            current_episode integer,
            current_watched_episode integer,
            rating real,
            status text,
            CONSTRAINT name_unique UNIQUE (name)
            )`,
        (err) => {
            if (err) {
                // Table already created
            }else{
                // Table just created
            }
        });  
    }
});

module.exports = db
