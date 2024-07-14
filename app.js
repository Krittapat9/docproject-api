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
    "INSERT INTO `staff` (`id`, `username`, `firstname`, `lastname`, `password`, `pin`) VALUES (NULL, ?, ?, ?, ?, ?)",
    [
      req.body.username,
      req.body.firstname,
      req.body.lastname,
      req.body.password,
      req.body.pin,
    ],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.post("/login", async (req, res) => {
  const { username, password } = req.body
  try {
    const result = await db.query(
      "SELECT * FROM staff WHERE username=$1 AND password=$2",
      [username, password]
    )
    const UserData = result.rows[0]

    if (!UserData) {
      return res.status(400).json({ success: false })
    }
    const isMatch = await compare(password, UserData.password)
    if (isMatch) {
      return res
        .status(200)
        .json({ success: true, message: "login successful" })
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid username and password" })
    }
  } catch (err) {
    console.error("Eror logging in", err.stack)
    return res.status(500).json({ success: false, message: "Error logging in" })
  }
})

//patient
app.get("/patient", (req, res) => {
  db.query("select * from patient ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/patient", (req, res) => {
  db.query(
    "INSERT INTO `patient` (`id`,`staff_id`,`firstname`, `lastname`, `sex`, `date_of_birth`, `hospital_number`, `date_of_registration`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?)"[
      (req.body.staff_id,
      req.body.firstname,
      req.body.lastname,
      req.body.sex,
      req.body.date_of_birth,
      req.body.hospital_number,
      req.body.date_of_registration)
    ],
    (err, result) => {
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
