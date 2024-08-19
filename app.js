require('dotenv').config()

const path = require('path')
const consola = require('consola')
const express = require('express')
const bodyParser = require('body-parser')

const sequelize = require('./config/database')

const noteRoutes = require('./routes/note')
const userRoutes = require('./routes/auth')

const app = express()

// Body Parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Routes
app.use('/api/notes', noteRoutes)
app.use('/api/auth', userRoutes)

// Start
sequelize
	.sync()
	.then(() => {
		app.listen(process.env.APP_PORT, process.env.APP_HOST, () => {
			consola.ready({
				message: `Server listening on port: ${process.env.APP_PORT}`,
				badge: true,
			})
		})
	})
	.catch((error) => {
		throw new Error(error)
	})
