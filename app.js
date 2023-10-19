const express = require("express")
const path = require("path")
const cors = require("cors")

const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const {open} = require("sqlite")
const sqlite3 = require("sqlite3")


const app = express()
app.use(cors())
app.use(express.json())

const dbPath = path.join(__dirname,"nxtTrenz.db")
let db = null 

const initializeDBAndServer = async ()=>{
      try{
            db = await open({
                  filename: dbPath,
                  driver: sqlite3.Database
            })
           app.listen(7000,()=>{
            console.log("Server Running At http://localhost:7000")
           }) 
      }catch(e){
            console.log(`DB Error ${e.message}`)
            process.exit(1)
      }
}


initializeDBAndServer();


app.post("/register", async(request,response)=>{
      const {username,password,name,email} = request.body

      const isUserExists = `SELECT * FROM user WHERE username="${username}"`
      const dbResponse = await db.get(isUserExists)

      if (dbResponse !== undefined){
            response.status(400)
            response.send("User already Exits")
      }else{
            if (password.length < 6){
                   response.status(400)
                   response.send("Password is too short")
            }else{
                  const hashedPassword = await bcrypt.hash(password,12)
                  const createNewUser = `INSERT INTO 
                  user (username,password,name,email) 
                  VALUES("${username}","${hashedPassword}","${name}","${email}");`

                  const dbResponse = await db.run(createNewUser)
                  response.status(200)
                  response.send("User Created Successfully")
            }
      }
})


app.post("/login", async(request,response)=>{
      const {username,password} = request.body

      const isUserExists = `SELECT * FROM user WHERE username = "${username}";`
      const dbResponse = await db.get(isUserExists)
     

      if (dbResponse === undefined){
            response.status(400)
            response.send("Username didn't match")
      }else{
            const isPasswordSame = await bcrypt.compare(password,dbResponse.password)

            if (isPasswordSame === false){
                  response.status(400)
                  response.send("Password didn't match")
            }else{
                  const payload = {username: username}
                  const jwtToken = jwt.sign(payload,"gajarla")
                  response.send(jwtToken)
            }
      }
})


const authenticateToken = (request,response,next)=>{
      let jwtToken;

      const authHeader = request.headers["authorization"]
      if (authHeader !== undefined){
            jwtToken = authHeader.split(" ")[0]
      }
      if (jwtToken === undefined){
            response.status(401)
            response.send({message:"Missing Authentication Token"})
      }else{
            jwt.verify(jwtToken, "gajarla", async (error,payload)=>{
                  if(error){
                        response.status(401)
                        response.send({message:"Missing Authentication Token"})
                  }else{
                        next()
                  }
            })
      }
      
}

app.get("/users", async (req,res)=>{
      const getUsers = `select * from user`
      const dbResponse = await db.all(getUsers)
      res.send(dbResponse)
})

app.get("/products", authenticateToken, async(request,response)=>{
      // const {queries} = request.query
      // console.log(queries)
      const sortBy = request.query.sort_by;
  const category = request.query.category;
  const titleSearch = request.query.title_search;
  const rating = request.query.rating;
      const getProducts =   
       `SELECT * FROM products ORDER BY price ASC;`
const dbResponse = await db.all(getProducts)
response.send(dbResponse)
})