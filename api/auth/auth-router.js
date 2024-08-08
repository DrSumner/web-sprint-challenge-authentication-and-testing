const router = require('express').Router();
const users = require('../usersModel')
const bcrypt = require('bcryptjs')
router.post('/register', (req, res,next) => {
  //res.end('implement register, please!');
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
 let greenlight = true
const {username, password} = req.body
if(!username || !password){
  return res.status(400).json({message:"username and password required"})
}
users.getByFilter(username)
.then(user => {
  if(user){
    greenlight = false
    return res.status(422).json({message:"username taken"})
  } 
  
})
if(greenlight){
const hash = bcrypt.hashSync(password, 8)
const user = {username:username, password:hash}

  users.create(user)
  .then( user => res.status(201).json(user))
  .catch(next)}
});

router.post('/login', (req, res, next) => {
  //res.end('implement login, please!');
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
 const {username, password} = req.body
 if(!username || !password){
  return res.status(400).json({message:"username and password required"})
}
users.getByFilter(username)
.then(user => {
  if(!user){
    return res.status(401).json({message:"invalid credentials"})
  }
  if(bcrypt.compareSync(password, user.password)){
    req.session.user = user 
   return res.json({message:`welcome, ${user.username}`})
  }
  else 
  return res.status(401).json({message:"invalid credentials"})
})
.then(next)


});

router.use((err,req,res,next) => { // eslint-disable-line
  res.status(err.status || 500).json({
      message: err.message,
      stack: err.stack,
    });
})

module.exports = router;
