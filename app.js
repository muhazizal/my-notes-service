require('dotenv').config()

const path = require('path')
const consola = require('consola')
const express = require('express')
const bodyParser = require('body-parser')

const sequelize = require('./config/database')

const noteRoutes = require('./routes/note')

const app = express()

// Body Parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Routes
app.use(noteRoutes)

// Start
sequelize
	.sync()
	.then(() => {
		app.listen(8000, '127.0.0.1', () => {
			consola.ready({
				message: `Server listening on port: ${8000}`,
				badge: true,
			})
		})
	})
	.catch((error) => {
		throw new Error(error)
	})
