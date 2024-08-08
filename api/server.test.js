const request = require('supertest')
const server = require('./server')
const db = require('../data/dbConfig')
const bcrypt = require('bcryptjs')
const {jwtDecode} = require('jwt-decode')

beforeEach(async () => {
  await db.migrate.rollback()
  await db.migrate.latest()
})
afterAll(async () => {
  await db.destroy()
})

// Write your tests here
it('[0]sanity', () => {
  expect(true).toBe(true)
})

describe('server.js', () => {
  describe('POST /api/auth/register', () => {
    it('[1] sucessfully registers a user', async () => {
      const userdata = {username:'bob',password:'1234'}

      const res = await request(server).post('/api/auth/register').send(userdata)
      expect(res.body).toEqual(expect.objectContaining({id:1, username:userdata.username}))
      expect(res.status).toEqual(201)
    })
    it('[2] correctly saves registered user password bcrypted', async () => {
      const userdata = {username:'bob',password:'1234'}

      await request(server).post('/api/auth/register').send(userdata)
      const bob = await db('users').where('username', 'bob').first()
      expect(bcrypt.compareSync('1234', bob.password)).toBeTruthy()
      
    })
    it('[3] correct err on missing credentials in body ', async () => {
      const userdata = {username:'bob'}

      const res = await request(server).post('/api/auth/register').send(userdata)
      expect(res.status).toEqual(400)
      expect(res.body.message).toMatch("username and password required")
    })
    it('[4] correct err on taken username', async () => {
      const userdata = {username:'bob',password:'1234'}
      await request(server).post('/api/auth/register').send(userdata)

      const res = await request(server).post('/api/auth/register').send(userdata)
      expect(res.status).toEqual(422)
      expect(res.body.message).toMatch("username taken")
    })
  })
  describe('POST /api/auth/login', () => {
    it('[5] sucessfully logins a user', async () => {
      const userdata = {username:'bob',password:'1234'}

     await request(server).post('/api/auth/register').send(userdata)
      const res = await request(server).post('/api/auth/login').send(userdata)
      expect(res.body.message).toMatch(`welcome, ${userdata.username}`)
      expect(res.status).toEqual(200)
    })
    it('[6] sucessfully creates token on login', async () => {
      const userdata = {username:'bob',password:'1234'}

     await request(server).post('/api/auth/register').send(userdata)
      const res = await request(server).post('/api/auth/login').send(userdata)
      let decoded = jwtDecode(res.body.token)
      expect(decoded).toHaveProperty('iat')
      expect(decoded).toHaveProperty('exp')
      expect(decoded).toMatchObject({
        subject: 1,
        username: 'bob',
      })
    })
    it('[7] correct err on wrong credentials', async () => {
      const userdata = {username:'bobby',password:'1'}

      const res = await request(server).post('/api/auth/login').send(userdata)
      expect(res.status).toEqual(401)
      expect(res.body.message).toMatch(`invalid credentials`)
    })
    it('[8] correct err on missing credentials in request body', async () => {
      const userdata = {username:'bobby'}

      const res = await request(server).post('/api/auth/login').send(userdata)
      expect(res.status).toEqual(400)
      expect(res.body.message).toMatch("username and password required")
    })
  })
  describe('GET /api/jokes', () => {
    it('[9] sucessfully blocks unauthorized request(no token)', async () => {
      const res = await request(server).get('/api/jokes')
      expect(res.body.message).toMatch('token required')
    }) 
    it('[10] sucessfully blocks unauthorized request(bad token)', async () => {
      const res = await request(server).get('/api/jokes').set('Authorization', 'false')
      expect(res.body.message).toMatch('token invalid')
    }) 
    it('[11] sucessfully returns jokes if authorized ', async () => {
      const userdata = {username:'bob',password:'1234'}

     await request(server).post('/api/auth/register').send(userdata)
      const user = await request(server).post('/api/auth/login').send(userdata)
      const token = user.body.token
      const res = await request(server).get('/api/jokes').set('Authorization', token)
      expect(res.body).toStrictEqual([
        {
            "id": "0189hNRf2g",
            "joke": "I'm tired of following my dreams. I'm just going to ask them where they are going and meet up with them later."
        },
        {
            "id": "08EQZ8EQukb",
            "joke": "Did you hear about the guy whose whole left side was cut off? He's all right now."
        },
        {
            "id": "08xHQCdx5Ed",
            "joke": "Why didn’t the skeleton cross the road? Because he had no guts."
        }
    ])
    }) 
  })
  

})