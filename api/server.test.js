const request = require('supertest')
const server = require('./server')
const db = require('../data/dbConfig')
const bcrypt = require('bcryptjs')

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
    it('[6] correct err on wrong credentials', async () => {
      const userdata = {username:'bobby',password:'1'}

      const res = await request(server).post('/api/auth/login').send(userdata)
      expect(res.status).toEqual(401)
      expect(res.body.message).toMatch(`invalid credentials`)
    })
    it('[7] correct err on missing credentials in request body', async () => {
      const userdata = {username:'bobby'}

      const res = await request(server).post('/api/auth/login').send(userdata)
      expect(res.status).toEqual(400)
      expect(res.body.message).toMatch("username and password required")
    })
  })

})