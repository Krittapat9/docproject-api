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

app.put("/staff/:id", (req, res) => {
  db.query(
    "UPDATE `staff` SET `username`=?, `firstname`=?, `lastname`=?, `password`=? WHERE `id`=?",
    [
      req.body.username,
      req.body.firstname,
      req.body.lastname,
      req.body.password,
      req.params.id,
    ],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/staff/:id", (req, res) => {
  db.query(
    "DELETE FROM `staff` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.post("/login", (req, res) => {
  const { username, password } = req.body

  db.query(
    "SELECT * FROM staff WHERE username=? AND password=?",
    [username, password],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: "fail",
          message: "Invalid username and password",
          staff: null,
        })
      }
      if (rows.length == 0) {
        return res.status(400).json({
          success: "fail",
          message: "Invalid username and password",
          staff: null,
        })
      }

      const userData = rows[0]

      return res.status(200).json({
        success: "success",
        message: "login successful",
        staff: userData,
      })
    }
  )
})

//patient
app.get("/patient", (req, res) => {
  db.query("select * from patient ", (err, rows) => {
    res.json(rows)
  })
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
      console.error
      res.json(result.affectedRows)
    }
  )
})

app.put("/patient/:id", (req, res) => {
  db.query(
    "UPDATE `patient` SET `staff_id`=?, `firstname`=?, `lastname`=?, `sex`=?, `date_of_birth`=?, `hospital_number`=? WHERE `id`=?",
    [
      req.body.staff_id,
      req.body.firstname,
      req.body.lastname,
      req.body.sex,
      req.body.date_of_birth,
      req.body.hospital_number,
      req.params.id,
    ],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/patient/:id", (req, res) => {
  db.query(
    "DELETE FROM `patient` WHERE `id`=?",
    [req.params.id],
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

app.put("/disease/:id", (req, res) => {
  db.query(
    "UPDATE `disease` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/disease/:id", (req, res) => {
  db.query(
    "DELETE FROM `disease` WHERE `id`=?",
    [req.params.id],
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

app.post("/appliances", (req, res) => {
  db.query(
    "INSERT INTO `appliances` (`id`,`type`,`name`, `brand`, `name_flange`, `name_pouch`, `size`) VALUES (NULL, ?, ?, ?, ?, ?, ?)",
    [
      req.body.type,
      req.body.name,
      req.body.brand,
      req.body.name_flange,
      req.body.name_pouch,
      req.body.size,
    ],
    (err, result) => {
      console.error
      res.json(result.affectedRows)
    }
  )
})

app.put("/appliances/:id", (req, res) => {
  db.query(
    "UPDATE `appliances` SET `type`=?, `name`=?, `brand`=?, `name_flange`=?, `name_pouch`=?, `size`=? WHERE `id`=?",
    [
      req.body.type,
      req.body.name,
      req.body.brand,
      req.body.name_flange,
      req.body.name_pouch,
      req.body.size,
      req.params.id,
    ],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/appliances/:id", (req, res) => {
  db.query(
    "DELETE FROM `appliances` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//medicine
app.get("/medicine", (req, res) => {
  db.query("select * from medicine ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/medicine", (req, res) => {
  db.query(
    "INSERT INTO `medicine` (`id`, `name`, `details`) VALUES (NULL, ?, ?)",
    [req.body.name, req.body.detail],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/medicine/:id", (req, res) => {
  db.query(
    "UPDATE `medicine` SET `name`=?, `details`=? WHERE `id`=?",
    [req.body.name, req.body.details, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/medicine/:id", (req, res) => {
  db.query(
    "DELETE FROM `medicine` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//mucocutaneous_suture_line
app.get("/mucocutaneous_suture_line", (req, res) => {
  db.query("select * from mucocutaneous_suture_line ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/mucocutaneous_suture_line", (req, res) => {
  db.query(
    "INSERT INTO `mucocutaneous_suture_line` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/mucocutaneous_suture_line/:id", (req, res) => {
  db.query(
    "UPDATE `mucocutaneous_suture_line` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/mucocutaneous_suture_line/:id", (req, res) => {
  db.query(
    "DELETE FROM `mucocutaneous_suture_line` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//peristomal_skin
app.get("/peristomal_skin", (req, res) => {
  db.query("select * from peristomal_skin ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/peristomal_skin", (req, res) => {
  db.query(
    "INSERT INTO `peristomal_skin` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/peristomal_skin/:id", (req, res) => {
  db.query(
    "UPDATE `peristomal_skin` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/peristomal_skin/:id", (req, res) => {
  db.query(
    "DELETE FROM `peristomal_skin` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//stoma_characteristics
app.get("/stoma_characteristics", (req, res) => {
  db.query("select * from stoma_characteristics ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma_characteristics", (req, res) => {
  db.query(
    "INSERT INTO `stoma_characteristics` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/stoma_characteristics/:id", (req, res) => {
  db.query(
    "UPDATE `stoma_characteristics` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/stoma_characteristics/:id", (req, res) => {
  db.query(
    "DELETE FROM `stoma_characteristics` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//stoma_color
app.get("/stoma_color", (req, res) => {
  db.query("select * from stoma_color ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma_color", (req, res) => {
  db.query(
    "INSERT INTO `stoma_color` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/stoma_color/:id", (req, res) => {
  db.query(
    "UPDATE `stoma_color` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/stoma_color/:id", (req, res) => {
  db.query(
    "DELETE FROM `stoma_color` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//stoma_construction
app.get("/stoma_construction", (req, res) => {
  db.query("select * from stoma_construction ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma_construction", (req, res) => {
  db.query(
    "INSERT INTO `stoma_construction` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/stoma_construction/:id", (req, res) => {
  db.query(
    "UPDATE `stoma_construction` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/stoma_construction/:id", (req, res) => {
  db.query(
    "DELETE FROM `stoma_construction` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//stoma_effluent
app.get("/stoma_effluent", (req, res) => {
  db.query("select * from stoma_effluent ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma_effluent", (req, res) => {
  db.query(
    "INSERT INTO `stoma_effluent` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/stoma_effluent/:id", (req, res) => {
  db.query(
    "UPDATE `stoma_effluent` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/stoma_effluent/:id", (req, res) => {
  db.query(
    "DELETE FROM `stoma_effluent` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//stoma_protrusion
app.get("/stoma_protrusion", (req, res) => {
  db.query("select * from stoma_protrusion ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma_protrusion", (req, res) => {
  db.query(
    "INSERT INTO `stoma_protrusion` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/stoma_protrusion/:id", (req, res) => {
  db.query(
    "UPDATE `stoma_protrusion` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/stoma_protrusion/:id", (req, res) => {
  db.query(
    "DELETE FROM `stoma_protrusion` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//stoma_shape
app.get("/stoma_shape", (req, res) => {
  db.query("select * from stoma_shape ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma_shape", (req, res) => {
  db.query(
    "INSERT INTO `stoma_shape` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/stoma_shape/:id", (req, res) => {
  db.query(
    "UPDATE `stoma_shape` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/stoma_shape/:id", (req, res) => {
  db.query(
    "DELETE FROM `stoma_shape` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//stoma_type
app.get("/stoma_type", (req, res) => {
  db.query("select * from stoma_type ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma_type", (req, res) => {
  db.query(
    "INSERT INTO `stoma_type` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/stoma_type/:id", (req, res) => {
  db.query(
    "UPDATE `stoma_type` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/stoma_type/:id", (req, res) => {
  db.query(
    "DELETE FROM `stoma_type` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//surgery_type
app.get("/surgery_type", (req, res) => {
  db.query("select * from surgery_type ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/surgery_type", (req, res) => {
  db.query(
    "INSERT INTO `surgery_type` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/surgery_type/:id", (req, res) => {
  db.query(
    "UPDATE `surgery_type` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/surgery_type/:id", (req, res) => {
  db.query(
    "DELETE FROM `surgery_type` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

//type_of_diversion
app.get("/type_of_diversion", (req, res) => {
  db.query("select * from type_of_diversion ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/type_of_diversion", (req, res) => {
  db.query(
    "INSERT INTO `type_of_diversion` (`id`, `name`) VALUES (NULL, ?)",
    [req.body.name],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.put("/type_of_diversion/:id", (req, res) => {
  db.query(
    "UPDATE `type_of_diversion` SET `name`=? WHERE `id`=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/type_of_diversion/:id", (req, res) => {
  db.query(
    "DELETE FROM `type_of_diversion` WHERE `id`=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
