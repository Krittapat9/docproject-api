const express = require("express")
const mysql = require("mysql")
const app = express()
const port = 3000

app.use(express.json())
app.use(express.urlencoded())

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  database: "docproject",
})

db.getConnection((err, connection) => {
  console.log(err, connection)
})

app.get("/", (req, res) => {
  res.send("Hello World!")
})

//staff
app.get("/staff", (req, res) => {
  db.query("select * from staff ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/staff", (req, res) => {
  db.query(
    "INSERT INTO `staff` (`id`, `username`, `firstname`, `lastname`, `password`) VALUES (NULL, ?, ?, ?, ?)",
    [
      req.body.username,
      req.body.firstname,
      req.body.lastname,
      req.body.password,
    ],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.post("/login", (req, res) => {
  const { username, password } = req.body

  db.query("SELECT * FROM staff WHERE username=? AND password=?",
      [username, password], (err, rows) => {
        if(err){
          return res.status(500).json({
            success:'fail',
            message:'Invalid username and password',
            staff:null,
          });
        }
        if (rows.length==0) {
          return res
            .status(400)
            .json({ 
              success: 'fail', 
              message: 'Invalid username and password',
              staff:null,
            });
        }

        const userData = rows[0]
    
        return res
            .status(200)
            .json({ 
              success: 'success', 
              message: "login successful",
              staff:userData,
            })
  })
})

//patient
app.get("/patient", (req, res) => {
  db.query("select * from patient ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/patient", (req, res) => {
  db.query(
    "INSERT INTO `patient` (`id`,`staff_id`,`firstname`, `lastname`, `sex`, `date_of_birth`, `hospital_number`, `date_of_registration`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)",
    [
      req.body.staff_id,
      req.body.firstname,
      req.body.lastname,
      req.body.sex,
      req.body.date_of_birth,
      req.body.hospital_number,
      req.body.date_of_registration,
    ],
    (err, result) => {
      console.error
      res.json(result.affectedRows)
    }
  )
})

//disease
app.get("/disease", (req, res) => {
  db.query("select * from disease ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/disease", (req, res) => {
  db.query(
    "INSERT INTO `disease`(`id`, `name`) VALUES(NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
