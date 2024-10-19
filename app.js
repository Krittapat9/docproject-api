const express = require("express")
const mysql = require("mysql")
const util = require("util")
const app = express()
const port = 3000
const nodemailer = require("nodemailer")
const smtpTransport = require("nodemailer-smtp-transport")
const { join } = require("path")

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

const queryAsync = util.promisify(db.query).bind(db)

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
    "UPDATE staff SET username=?, firstname=?, lastname=?, password=? WHERE id=?",
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
  db.query("DELETE FROM staff WHERE id=?", [req.params.id], (err, result) => {
    res.json(result.affectedRows)
  })
})

app.post("/login", (req, res) => {
  const { username, password } = req.body

  db.query(
    "SELECT * FROM staff WHERE username=? AND password=?",
    [username, password],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "fail",
          message: "Invalid username and password",
          staff: null,
        })
      }
      if (rows.length == 0) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid username and password",
          staff: null,
        })
      }

      const userData = rows[0]

      return res.status(200).json({
        status: "success",
        message: "login successful",
        staff: userData,
      })
    }
  )
})

app.post("/login_patient", (req, res) => {
  const {email} = req.body

  db.query(
    "SELECT * FROM patient WHERE email=?",
    [email],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          status: "fail",
          message: "Invalid email",
          patient: null,
        })
      }
      if (rows.length == 0) {
        return res.status(400).json({
          status: "fail",
          message: "Invalid email",
          patient: null,
        })
      }

      const userData = rows[0]

      return res.status(200).json({
        status: "success",
        message: "login successful",
        patient: userData,
      })
    }
  )
})



//ต้องมี endpoint login patient ส่ง email ของ patient อีก endpoint เอาไว้ verifly otp เก้บใน db , เพิ่มหน้า patient ทุกอัน
//login_patient
app.post("/login_patient/otp", async (req, res) => {
  const { email } = req.body

  if (!email) {
    return res.status(400).json({ error: "Email is required" })
  }

  // สร้าง OTP เก็บใน db
  const otp = generateOTP()
  console.log(`Generated OTP for ${email}: ${otp}`)

  // ส่ง OTP ไปอีเมลผู้ป่วย
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is ${otp}. Please use this code to verify your email.`,
  }

  try {
    await transporter.sendMail(mailOptions)
    return res.status(200).json({ message: "OTP sent successfully" })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return res.status(500).json({ error: "Failed to send OTP" })
  }
})

//patient
//query แสดงการชื่อนามหมอ อันแรกแสดงแค่ staff id
//select pt.id as id, pt.staff_id, pt.firstname, pt.lastname, pt.sex, pt.date_of_birth, pt.hospital_number, pt.date_of_registration, sf.firstname as staff_firstname, sf.lastname as staff_lastname FROM patient pt JOIN staff sf on pt.staff_id = sf.id;
app.get("/patient", (req, res) => {
  const {q, start = 0, limit = 10 } = req.query;//รับพารามิเตอร์

  let query = "select p.* ,sf.firstname as staff_firstname, sf.lastname as staff_lastname from patient p LEFT JOIN staff sf on p.staff_id = sf.id";//สร้างคำสั่ง SQL เพื่อดึงข้อมูล
  let params = [];

  if (q) {
    query += " WHERE firstname LIKE ? OR lastname LIKE ? OR email LIKE ?";
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);//ตรวจสอบว่ามีพารามิเตอร์ q หรือไม่ ถ้ามีจะเพิ่มเงื่อนไขการค้นหาตามชื่อหรืออีเมลของผู้ใช้
  }

  query += " LIMIT ?, ?";//LIMIT: เป็นคำสั่งใน SQL ที่ใช้เพื่อระบุจำนวนแถวสูงสุดที่จะนำมาแสดงผลจากผลลัพธ์ของคำสั่ง SELECT
  params.push(parseInt(start), parseInt(limit));//เพิ่มข้อจำกัดการแสดงผลตามค่าของ start และ limit เพื่อควบคุมจำนวนข้อมูลที่แสดงผล

  db.query(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: "not found patient"});
    }
    res.json(rows);
  });
});



app.get("/patient/:id", (req, res) => {
  db.query(
    "select p.* ,sf.firstname as staff_firstname, sf.lastname as staff_lastname from patient p LEFT JOIN staff sf on p.staff_id = sf.id where p.id = ?",
    [req.params.id],
    (err, rows) => {
      if (rows.length == 1) {
        res.json(rows[0])
      } else {
        res.status(404).json({
          message: "patient not found",
        })
      }
    }
  )
})
app.post("/patient", (req, res) => {

  const { staff_id, firstname, lastname, sex, date_of_birth, hospital_number, date_of_registration, email} = req.body;

  //ไว้ใช้เช็ครูปแบบemail
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRegex.test(email)) {
      return res.status(400).json({ error: "wrong email format"});
  }

  //ไว้ใช้เช็คemailซ้ำในdb
  db.query("SELECT * FROM patient WHERE email = ?", [email], (err, results) => {
    if(err) {
      return res.status(500).json({ error: "server error"});
    }

    if(results.length > 0) {
      return res.status(400).json({ error: "This email is already in use."})
    }

    db.query(
      "INSERT INTO patient (staff_id, firstname, lastname, sex, date_of_birth, hospital_number, date_of_registration, email) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [staff_id, firstname, lastname, sex, date_of_birth, hospital_number, date_of_registration, email],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: "sever error"});
        }

        const patientId = results.insertId;
        db.query(
          "SELECT * FROM patient WHERE id = ?",
          [patientId],
          (err, results) => {
            if (err || results.length !=1) {
              console.error(err)
              res.status(404).json({
                error: "patient not found",
              });
              return
            }
            res.json(results[0])
          }
        );
       }
      );
  });
});

// app.post("/patient", (req, res) => {
//   db.query(
//     "INSERT INTO `patient` (`id`,`staff_id`,`firstname`, `lastname`, `sex`, `date_of_birth`, `hospital_number`, `date_of_registration`, `email`) VALUES (NULL, ?, ?, ?, ?, ?, ?, now(), ?)",
//     [
//       req.body.staff_id,
//       req.body.firstname,
//       req.body.lastname,
//       req.body.sex,
//       req.body.date_of_birth,
//       req.body.hospital_number,
//       req.body.date_of_registration,
//       req.body.email,
//     ],
//     (err, result) => {
//       if (err) {
//         console.error(err)
//         res.status(500).json({ error: "Error inserting patient data" })
//         return
//       }
//       const patientId = result.insertId

//       db.query(
//         "SELECT * FROM patient WHERE id = ?",
//         [patientId],
//         (err, result) => {
//           if (err || result.length != 1) {
//             console.error(err)
//             res.status(404).json({
//               message: "patient not found",
//             })
//             return
//           }
//           res.json(result[0])
//         }
//       )
//     }
//   )
// })

app.put("/patient/:id", (req, res) => {
  db.query(
    "UPDATE patient SET staff_id=?, firstname=?, lastname=?, sex=?, date_of_birth=?, hospital_number=? WHERE id=?",
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
    "DELETE FROM patient WHERE id=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})
app.put("/disease/:id", (req, res) => {
  db.query(
    "UPDATE disease SET name=? WHERE id=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})


//get patient surgery
app.get("/patient/:patient_id/surgery", (req, res) => {
  db.query(
    `
    SELECT s.id as id,s.patient_id, s.surgery_type_note_other,s.disease_note_other,s.surgery_type_id as surgery_type_id, s.disease_id as disease_id, d.name as disease_name, st.name as surgery_type_name, s.date_of_surgery as date_of_surgery, s.staff_id,sf.username as username, sf.firstname as staff_firstname, sf.lastname as staff_lastname, sm.id as stoma_id, smt.name as stoma_type_name, sm.stoma_type_note_other as stoma_type_note_other, s.case_id
    FROM surgery s 
    LEFT JOIN surgery_type st on s.surgery_type_id = st.id
    LEFT JOIN disease d on s.disease_id = d.id
    LEFT JOIN staff sf on s.staff_id = sf.id
    LEFT JOIN stoma sm on s.stoma_id = sm.id
    LEFT JOIN stoma_type smt on sm.stoma_type_id = smt.id
    WHERE s.patient_id=?
    ORDER BY s.case_id DESC 
  `,
    [req.params.patient_id],
    (err, rows) => {
      res.json(rows)
    }
  )
})

//post patient surgery
app.post("/patient/:patient_id/surgery", async (req, res) => {
  let caseId = await queryAsync(
    "SELECT max(case_id) as case_id FROM surgery WHERE patient_id = ?",
    [req.params.patient_id]
  )

  caseId[0].case_id++
  //return res.status(200).json(caseId[0].case_id++)
  db.query(
    "INSERT INTO `surgery` (`id`, `patient_id`, `surgery_type_id`, `surgery_type_note_other`, `disease_id`, `disease_note_other`, `date_of_surgery`, `staff_id`, `stoma_id`, `case_id`) VALUES (NULL, ?, ? ,? ,? ,?, ?, ?, NULL, ?)",
    [
      req.params.patient_id,
      req.body.surgery_type_id,
      req.body.surgery_type_note_other,
      req.body.disease_id,
      req.body.disease_note_other,
      req.body.date_of_surgery,
      req.body.staff_id,
      caseId[0].case_id,
    ],
    (err, result) => {
      if (err) {
        console.error(err)
        res.status(500).json({ error: "Error inserting patient data" })
        return
      }
      const surgeryId = result.insertId

      db.query(
        "SELECT * FROM surgery WHERE id = ?",
        [surgeryId],
        (err, result) => {
          if (err || result.length != 1) {
            console.error(err)
            res.status(404).json({
              message: "surgery not found",
            })
            return
          }
          res.json(result[0])
        }
      )
    }
  )
})

app.put("/patient/:id", (req, res) => {
  db.query(
    "UPDATE patient SET staff_id=?, firstname=?, lastname=?, sex=?, date_of_birth=?, hospital_number=? WHERE id=?",
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
  db.query("DELETE FROM patient WHERE id=?", [req.params.id], (err, result) => {
    res.json(result.affectedRows)
  })
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
    "UPDATE disease SET name=? WHERE id=?",
    [req.body.name, req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})

app.delete("/disease/:id", (req, res) => {
  db.query("DELETE FROM disease WHERE id=?", [req.params.id], (err, result) => {
    res.json(result.affectedRows)
  })
})

//appliances
app.get("/appliances", (req, res) => {
  db.query("select * from appliances ", (err, rows) => {
    res.json(rows)
  })
})

app.get("/appliances/:id", (req, res) => {
  db.query(
    "select * from appliances where id = ?",
    [req.params.id],
    (err, rows) => {
      if (rows.length == 1) {
        res.json(rows[0])
      } else {
        res.status(404).json({
          message: "appliances not found",
        })
      }
    }
  )
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

app.put("/appliances/:id", (req, res) => {
  db.query(
    "UPDATE appliances SET type=?, name=?, brand=?, name_flange=?, name_pouch=?, size=? WHERE id=?",
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
    "DELETE FROM appliances WHERE id=?",
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

app.get("/medicine/:id", (req, res) => {
  db.query(
    "select * from medicine where id = ?",
    [req.params.id],
    (err, rows) => {
      if (rows.length == 1) {
        res.json(rows[0])
      } else {
        res.status(404).json({
          message: "medicine not found",
        })
      }
    }
  )
})

app.post("/medicine", (req, res) => {
  db.query(
    "INSERT INTO `medicine` (`id`, `name`, `details`) VALUES (NULL, ?, ?)",
    [
      req.body.name,
      req.body.details,
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

function queryMedicalHistory(whereColumn) {
  return `SELECT mh.id as id, mh.staff_id, sf.firstname as staff_firstname, sf.lastname as staff_lastname, mh.surgery_id, mh.datetime_of_medical, mh.type_of_diversion_id as type_of_diversion_id, tod.name as type_of_diversion_name, mh.type_of_diversion_note_other, mh.stoma_construction_id, smcon.name as stoma_construction_name, mh.stoma_color_id, smco.name as stoma_color_name, mh.stoma_size_width_mm, mh.stoma_size_length_mm, mh.stoma_characteristics_id, smcha.name as stoma_characteristics_name, mh.stoma_characteristics_note_other, mh.stoma_shape_id, smsh.name as stoma_shape_name, mh.stoma_protrusion_id, smpro.name as stoma_protrusion_name, mh.peristomal_skin_id, ps.name as peristomal_skin_name, mh.mucocutaneous_suture_line_id, msl.name as mucocutaneous_suture_line_name, mh.mucocutaneous_suture_line_note_other, mh.stoma_effluent_id, sme.name as stoma_effluent_name, mh.appliances_id, app.name as appliances_name, app.type as appliances_type, mh.medicine_id, mc.name as medicine_name, mh.case_id
    FROM medical_history mh
    LEFT JOIN staff sf on mh.staff_id = sf.id
    LEFT JOIN surgery s on mh.surgery_id = s.id
    LEFT JOIN type_of_diversion tod on mh.type_of_diversion_id = tod.id
    LEFT JOIN stoma_construction smcon on mh.stoma_construction_id = smcon.id
    LEFT JOIN stoma_color smco on mh.stoma_color_id = smco.id
    LEFT JOIN stoma_characteristics smcha on mh.stoma_characteristics_id = smcha.id
    LEFT JOIN stoma_shape smsh on mh.stoma_shape_id = smsh.id
    LEFT JOIN stoma_protrusion smpro on mh.stoma_protrusion_id = smpro.id
    LEFT JOIN peristomal_skin ps on mh.peristomal_skin_id = ps.id
    LEFT JOIN mucocutaneous_suture_line msl on mh.mucocutaneous_suture_line_id = msl.id
    LEFT JOIN stoma_effluent sme on mh.stoma_effluent_id = sme.id
    LEFT JOIN appliances app on mh.appliances_id = app.id
    LEFT JOIN medicine mc on mh.medicine_id = mc.id
    WHERE mh.${whereColumn}=?
    ORDER BY datetime_of_medical DESC`
    
}

//surgery_id

app.get("/surgery/:id", async (req, res) => {
  let rowsSurgery = await queryAsync(
    // SELECT s.id as id,s.patient_id, s.surgery_type_note_other,s.disease_note_other,s.surgery_type_id as surgery_type_id, s.disease_id as disease_id, d.name as disease_name, st.name as surgery_type_name, s.date_of_surgery as date_of_surgery, s.staff_id,sf.username as username, sf.firstname as staff_firstname, sf.lastname as staff_lastname, sm.id as stoma_id, smt.name as stoma_type_name, sm.stoma_type_note_other as stoma_type_note_other
 `
    SELECT s.id as id, s.patient_id, s.surgery_type_note_other, s.disease_note_other, s.surgery_type_id as surgery_type_id, s.disease_id as disease_id, d.name as disease_name, st.name as surgery_type_name, s.date_of_surgery as date_of_surgery, s.staff_id,sf.username as username, sf.firstname as staff_firstname, sf.lastname as staff_lastname, sm.id as stoma_id, smt.name as stoma_type_name, sm.stoma_type_note_other as stoma_type_note_other, s.case_id as case_id
    FROM surgery s 
    LEFT JOIN surgery_type st on s.surgery_type_id = st.id
    LEFT JOIN disease d on s.disease_id = d.id
    LEFT JOIN staff sf on s.staff_id = sf.id
    LEFT JOIN stoma sm on s.stoma_id = sm.id
    LEFT JOIN stoma_type smt on sm.stoma_type_id = smt.id
    WHERE s.id=?
    ORDER BY date_of_surgery DESC 
  `,
    [req.params.id]
  )
  if (rowsSurgery.length == 0) {
    return res.status(404)
  }
  let surgery = rowsSurgery[0]

  let rowsPatient = await queryAsync(`SELECT * FROM patient WHERE id=?`, [
    surgery.patient_id,
  ])
  let patient = rowsPatient[0]

  let rowsMedicalHistory = await queryAsync(queryMedicalHistory("surgery_id"), [
    req.params.id,
  ])

  res.json({
    patient,
    surgery,
    medical_history: rowsMedicalHistory,
  })
})

app.delete("/surgery/:id", (req, res) => {
  db.query(
    "DELETE FROM surgery WHERE id=?",
    [req.params.id],
    (err, result) => {
      res.json(result.affectedRows)
    }
  )
})
//medical_history_id
app.get("/medical_history/:id", async (req, res) => {
  let rowsMedicalHistory = await queryAsync(queryMedicalHistory("id"), [
    req.params.id,
  ])
  console.log("rowsMedicalHistory", rowsMedicalHistory)
  if (rowsMedicalHistory.length == 0) {
    return res.status(404)
  }
  let medicalHistory = rowsMedicalHistory[0]
  res.json(medicalHistory)
})

//stoma
app.get("/stoma/type", (req, res) => {
  db.query("select * from stoma_type ", (err, rows) => {
    res.json(rows)
  })
})

app.post("/stoma", (req, res) => {
  db.query(
    "INSERT INTO `stoma` (`id`, `stoma_type_id`, `stoma_type_note_other`) VALUES (NULL, ?, ?)",
    [req.body.stoma_type_id, req.body.stoma_type_note_other],
    (err, result) => {
      let stoma_id = result.insertId
      db.query(
        "UPDATE `surgery` SET `stoma_id` = ? WHERE `surgery`.`id` = ?",
        [stoma_id, req.body.surgery_id],
        (err, result) => {
          res.json({ stoma_id })
        }
      )
    }
  )
})

//medical history info page
// SELECT mh.id as id, mh.staff_id, sf.firstname as staff_firstname, sf.lastname as staff_lastname, mh.surgery_id, mh.datetime_of_medical, mh.type_of_diversion_id as type_of_diversion_id, tod.name as type_of_diversion_name, mh.type_of_diversion_note_other, mh.stoma_construction_id, smcon.name as stoma_construction_name, mh.stoma_color_id, smco.name as stoma_color_name, mh.stoma_size_width_mm, mh.stoma_size_length_mm, mh.stoma_characteristics_id, smcha.name as stoma_characteristics_name, mh.stoma_characteristics_note_other, mh.stoma_shape_id, smsh.name as stoma_shape_name, mh.stoma_protrusion_id, smpro.name as stoma_protrusion_name, mh.peristomal_skin_id, ps.name as peristomal_skin_name, mh.mucocutaneous_suture_line_id, msl.name as mucocutaneous_suture_line_name, mh.mucocutaneous_suture_line_note_other, mh.stoma_effluent_id, sme.name as stoma_effluent_name, mh.appliances_id, app.name as appliances_name, app.type as appliances_type, mh.medicine_id, mc.name as medicine_name
// FROM medical_history mh
// LEFT JOIN staff sf on mh.staff_id = sf.id
// LEFT JOIN surgery s on mh.surgery_id = s.id
// LEFT JOIN type_of_diversion tod on mh.type_of_diversion_id = tod.id
// LEFT JOIN stoma_construction smcon on mh.stoma_construction_id = smcon.id
// LEFT JOIN stoma_color smco on mh.stoma_color_id = smco.id
// LEFT JOIN stoma_characteristics smcha on mh.stoma_characteristics_id = smcha.id
// LEFT JOIN stoma_shape smsh on mh.stoma_shape_id = smsh.id
// LEFT JOIN stoma_protrusion smpro on mh.stoma_protrusion_id = smpro.id
// LEFT JOIN peristomal_skin ps on mh.peristomal_skin_id = ps.id
// LEFT JOIN mucocutaneous_suture_line msl on mh.mucocutaneous_suture_line_id = msl.id
// LEFT JOIN stoma_effluent sme on mh.stoma_effluent_id = sme.id
// LEFT JOIN appliances app on mh.appliances_id = app.id
// LEFT JOIN medicine mc on mh.medicine_id = mc.id
// WHERE mh.surgery_id=?

//post medical history
app.post("/surgery/:surgery_id/medical_history", async(req, res)  => {
  let caseId = await queryAsync(
    "SELECT max(case_id) as case_id FROM medical_history WHERE surgery_id = ?",
    [req.params.surgery_id]
  )

  caseId[0].case_id++
  console.log(req.params, req.body)
  db.query(
    "INSERT INTO `medical_history` (`id`, `staff_id`, `surgery_id`, `datetime_of_medical`, `type_of_diversion_id`, `type_of_diversion_note_other`, `stoma_construction_id`, `stoma_color_id`, `stoma_size_width_mm`, `stoma_size_length_mm`, `stoma_characteristics_id`, `stoma_characteristics_note_other`, `stoma_shape_id`, `stoma_protrusion_id`, `peristomal_skin_id`, `mucocutaneous_suture_line_id`, `mucocutaneous_suture_line_note_other`, `stoma_effluent_id`, `appliances_id`, `medicine_id`, `case_id`) VALUES (NULL, ?, ? , now(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      req.body.staff_id,
      req.params.surgery_id,
      req.body.type_of_diversion_id,
      req.body.type_of_diversion_note_other,
      req.body.stoma_construction_id,
      req.body.stoma_color_id,
      req.body.stoma_size_width_mm,
      req.body.stoma_size_length_mm,
      req.body.stoma_characteristics_id,
      req.body.stoma_characteristics_note_other,
      req.body.stoma_shape_id,
      req.body.stoma_protrusion_id,
      req.body.peristomal_skin_id,
      req.body.mucocutaneous_suture_line_id,
      req.body.mucocutaneous_suture_line_note_other,
      req.body.stoma_effluent_id,
      req.body.appliances_id,
      req.body.medicine_id,
      caseId[0].case_id,
    ],
    (err, result) => {
      if (err) {
        console.error(err)
        res.status(500).json({ error: "Error inserting medical data" })
        return
      }
      const medicalId = result.insertId

      console.log("medicalid", medicalId)

      db.query(
        "SELECT * FROM medical_history WHERE id = ?",
        [medicalId],
        (err, result) => {
          if (err || result.length != 1) {
            console.error(err)
            res.status(404).json({
              message: "medical not found",
            })
            return
          }
          res.json(result[0])
        }
      )
    }
  )
})

//type of diversion
app.get("/type_of_diversion", (req, res) => {
  db.query("select * from type_of_diversion ", (err, rows) => {
    res.json(rows)
  })
})

//stoma construction
app.get("/stoma_construction", (req, res) => {
  db.query("select * from stoma_construction", (err, rows) => {
    res.json(rows)
  })
})

//stoma color
app.get("/stoma_color", (req, res) => {
  db.query("select * from stoma_color", (err, rows) => {
    res.json(rows)
  })
})

//stoma characteristics
app.get("/stoma_characteristics", (req, res) => {
  db.query("select * from stoma_characteristics", (err, rows) => {
    res.json(rows)
  })
})

//stoma shape
app.get("/stoma_shape", (req, res) => {
  db.query("select * from stoma_shape", (err, rows) => {
    res.json(rows)
  })
})

//stoma protrusion
app.get("/stoma_protrusion", (req, res) => {
  db.query("select * from stoma_protrusion", (err, rows) => {
    res.json(rows)
  })
})

//peristomal skin
app.get("/peristomal_skin", (req, res) => {
  db.query("select * from peristomal_skin", (err, rows) => {
    res.json(rows)
  })
})

//mucocutaneous suture line
app.get("/mucocutaneous_suture_line", (req, res) => {
  db.query("select * from mucocutaneous_suture_line", (err, rows) => {
    res.json(rows)
  })
})

//stoma effluent
app.get("/stoma_effluent", (req, res) => {
  db.query("select * from stoma_effluent", (err, rows) => {
    res.json(rows)
  })
})

//sendmail
app.get("/test", (req, res) => {
  const transporter = nodemailer.createTransport(
    smtpTransport({
      service: "Outlook365",
      host: "smtp.office365.com",
      secureConnection: false,
      port: 587,
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      auth: {
        user: "siravitkrittapat@outlook.com",
        pass: "appproject123456",
      },
    })
  )

  const mailOptions = {
    from: "siravitkrittapat@outlook.com",
    to: "siravotpookahoot@gmail.com",
    subject: "Sending Email using Node.js",
    text: "That was easy!",
  }

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error)
    } else {
      console.log("Email sent: " + info.response)
    }
  })
})
//ต้องมี endpoint login patient ส่ง email ของ patient อีก endpoint เอาไว้ verifly otp เก้บใน db , เพิ่มหน้า patient ทุกอัน

// select p.* ,sf.firstname as staff_firstname, sf.lastname as staff_lastname from patient p LEFT JOIN staff sf on p.staff_id = sf.id where p.id = ?
app.get("/schedule/staff/:staff_id/:workSchedule", async (req,res) => {
  let scheduleStaff = await queryAsync('select ws.*,p.firstname as patient_firstname, p.lastname as patient_lastname from work_schedule ws LEFT JOIN patient p on ws.patient_id = p.id where ws.staff_id = ? AND ws.work_date = ? ORDER BY ws.start_time ASC', [
    req.params.staff_id,
    req.params.workSchedule,
  ])
  res.json(scheduleStaff)
})

app.get("/schedule/patient/:patient_id", async (req,res) => {
  let schedulePatient = await queryAsync('select * from work_schedule where patient_id = ?', [
    req.params.patient_id,
  ])
  res.json(schedulePatient)
})

app.post("/schedule",async(req,res) => {
  let result = await queryAsync("INSERT INTO `work_schedule` (`id`, `staff_id`, `patient_id`, `work_date`,`start_time`, `end_time`, `detail`) VALUES (NULL, ?, ?, ?, ?, ?, ?)",
    [
      req.body.staff_id,
      req.body.patient_id,
      req.body.work_date,
      req.body.start_time,
      req.body.end_time,
      req.body.detail,
    ])
  let insertedSchedule = await queryAsync("SELECT * FROM work_schedule WHERE id = ?",
        [result.insertId],
        )
    res.json(insertedSchedule[0])
})



app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
