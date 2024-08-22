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
      if (err) {
        return res.status(500).json({
          status: 'fail',
          message: 'Invalid username and password',
          staff: null,
        });
      }
      if (rows.length == 0) {
        return res
          .status(400)
          .json({
            status: 'fail',
            message: 'Invalid username and password',
            staff: null,
          });
      }

      const userData = rows[0]

      return res
        .status(200)
        .json({
          status: 'success',
          message: "login successful",
          staff: userData,
        })
    })
})


//patient
app.get("/patient", (req, res) => {
  db.query("select * from patient ", (err, rows) => {
    res.json(rows)
  })
})

app.get("/patient/:id", (req, res) => {
  db.query("select * from patient where id = ?", [req.params.id], (err, rows) => {
    if (rows.length == 1) {
      res.json(rows[0])
    }
    else {
      res.status(404).json({
        message: "patient not found",
      })
    }
  })
})

app.get("/patient/:patient_id/surgery", (req, res) => {
  db.query(`
    SELECT s.id as id,s.patient_id, s.surgery_type_note_other,s.disease_note_other,s.surgery_type_id as surgery_type_id, s.disease_id as disease_id, d.name as disease_name, st.name as surgery_type_name, s.date_of_surgery as date_of_surgery, s.staff_id,sf.username as username, sf.firstname as staff_firstname, sf.lastname as staff_lastname, sm.id as stoma_id, smt.name as stoma_type_name
    FROM surgery s 
    LEFT JOIN surgery_type st on s.surgery_type_id = st.id
    LEFT JOIN disease d on s.disease_id = d.id
    LEFT JOIN staff sf on s.staff_id = sf.id
    LEFT JOIN stoma sm on s.stoma_id = sm.id
    LEFT JOIN stoma_type smt on sm.stoma_type_id = smt.id
    WHERE s.patient_id=?
    ORDER BY date_of_surgery DESC 
  `, [req.params.patient_id], (err, rows) => {
    for (let i = 0; i < rows.length; i++) {
      rows[i].case_id = rows.length - i
    }
    res.json(rows)
  })
})

app.post("/patient/:patient_id/surgery", (req, res) => {
  db.query("INSERT INTO `surgery` (`id`, `patient_id`, `surgery_type_id`, `surgery_type_note_other`, `disease_id`, `disease_note_other`, `date_of_surgery`, `staff_id`, `stoma_id`) VALUES (NULL, ?, ? ,? ,? ,?, ?, ?, NULL)",
    [
      req.params.patient_id,
      req.body.surgery_type_id,
      req.body.surgery_type_note_other,
      req.body.disease_id,
      req.body.disease_note_other,
      req.body.date_of_surgery,
      req.body.staff_id,

    ],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error inserting patient data' });
        return;
      }
      const surgeryId = result.insertId;

      db.query(
        "SELECT * FROM surgery WHERE id = ?",
        [surgeryId], (err, result) => {
          if (err || result.length != 1) {
            console.error(err);
            res.status(404).json({
              message: "patient not found",
            });
            return;
          }
          res.json(result[0]);
        })

    }
  )
})

app.post("/patient", (req, res) => {
  db.query(
    "INSERT INTO `patient` (`id`,`staff_id`,`firstname`, `lastname`, `sex`, `date_of_birth`, `hospital_number`, `date_of_registration`) VALUES (NULL, ?, ?, ?, ?, ?, ?, now())",
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
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Error inserting patient data' });
        return;
      }
      const patientId = result.insertId;

      db.query(
        "SELECT * FROM patient WHERE id = ?",
        [patientId],
        (err, result) => {
          if (err || result.length != 1) {
            console.error(err);
            res.status(404).json({
              message: "patient not found",
            });
            return;
          }
          res.json(result[0]);
        })
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


//appliances
app.get("/appliances", (req, res) => {
  db.query("select * from appliances ", (err, rows) => {
    res.json(rows)
  })
})

app.get("/appliances/:id", (req, res) => {
  db.query("select * from appliances where id = ?", [req.params.id], (err, rows) => {
    if (rows.length == 1) {
      res.json(rows[0])
    }
    else {
      res.status(404).json({
        message: "appliances not found",
      })
    }
  })
})

app.post("/appliances", (req, res) => {
  db.query(
    "INSERT INTO `appliances` (`id`, `type`, `name`, `brand`, `name_flange`, `name_pouch`, `size`) VALUES (NULL, ?, ?, ?, ?, ?, ?)",
    [
      req.body.type,
      req.body.name,
      req.body.brand,
      req.body.name_flange,
      req.body.name_pouch,
      req.body.size,
    ],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})


//surgery
app.get("/surgery/type", (req, res) => {
  db.query("select * from surgery_type ", (err, rows) => {
    res.json(rows)
  })
})



app.get("/stoma/type", (req, res) => {
  db.query("select * from stoma_type ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma", (req, res) => {
  db.query(
    "INSERT INTO `stoma` (`id`, `stoma_type_id`, `stoma_type_note_other`) VALUES (NULL, ?, ?)",
    [
      req.body.stoma_type_id,
      req.body.stoma_type_note_other,
    ],
    (err, result) => {
      let stoma_id = result.insertId
      db.query(
        "UPDATE `surgery` SET `stoma_id` = ? WHERE `surgery`.`id` = ?",
        [
          stoma_id,
          req.body.surgery_id,
        ],
        (err, result) => {
          res.json({stoma_id})
        }

      )
    }
  )
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
