const db = require('../data/dbConfig')

function getAll() {
return db('users')
}

function getById(id) {
return db('users')
.where('id', id)
.first()
}

function getByFilter(filter) {
return db('users')
.where("username", filter)
.first()
}

function create(user) {
    return db('users')
    .insert(user)
    .then(([id]) => getById(id))
    }

module.exports = {
    getAll, getByFilter, getById, create,
}