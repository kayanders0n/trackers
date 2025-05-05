/**
 * Configuration and connection setup for Firebird database
 * This module provides a function to establish a connection with a Firebird database
 */

const Firebird = require("node-firebird");
const path = require("path");

/**
 * Database connection configuration options
 * @type {Object}
 * @property {string} host - Database server host (default: localhost)
 * @property {number} port - Database server port (default: 3050)
 * @property {boolean} wireCrypt - Whether to use wire encryption (disabled for development)
 * @property {string} database - Path to the Firebird database file
 * @property {string} user - Database user credentials
 * @property {string} password - Database password
 */
const options = {
  host: "localhost",
  port: 3050,
  wireCrypt: false,
  database: "C:\\Databases\\tracker.FDB",
  user: "SYSDBA",
  password: "masterkey",
};

/**
 * Creates and returns a Promise that resolves with a Firebird database client
 * @returns {Promise<Object>} A promise that resolves with the database client
 * @throws {Error} If the connection fails
 */
function getFirebirdClient() {
  return new Promise((resolve, reject) => {
    Firebird.attach(options, (err, client) => {
      if (err) {
        console.error("Connection error:", err);
        reject(err);
      } else {
        resolve(client);
      }
    });
  });
}

module.exports = getFirebirdClient;
