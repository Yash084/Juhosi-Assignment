const mysql = require('mysql2');
const express = require('express');
const bodyParser = require('body-parser');

require('dotenv').config()

const PORT = process.env.PORT || 5000;



const app = express();


// Set EJS as the view engine
app.set('view engine', 'ejs');

// Specify the views directory
app.set('views', __dirname + '/views');

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));


app.use('/assets', express.static('assets'));

const connection = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USERNAME, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DBNAME,
})





connection.connect(function (error) {
    if (error) throw error;
    else console.log("connected to database successfully");
})





app.get('/', function (req, resp) {
    resp.sendFile(__dirname + "/index.html");
    console.log(__dirname);
})





app.post("/", function (req, resp) {
    const { id, password } = req.body;

    // Execute SQL SELECT query to check credentials
    const sql = "SELECT * FROM auth WHERE id = ? AND password = ?";
    connection.query(sql, [id, password], function (error, result) {
        if (error) {
            // Handle the error
            console.error(error);
            // Provide appropriate feedback to the user
            resp.send("Error occurred while logging in.");
        } else {
            if (result.length > 0) {
                // User authenticated successfully, redirect to appropriate route
                if (id === "admin") {
                    resp.redirect("/admin");
                } else if (id === "customer1" || id === "customer2") {
                    resp.redirect("/customer");
                } else {
                    // Handle invalid ID
                    resp.send("Invalid ID.");
                }
            } else {
                // Authentication failed, redirect back to login page
                resp.redirect("/");
            }
        }
    });
});



// when login is success 


app.get('/customer', function (req, resp) {
    resp.sendFile(__dirname + '/customer.html');
});
app.get('/admin', function (req, resp) {
    // Execute SQL queries to retrieve data
    const sqlCustomer1 = "SELECT SUM(quantity) AS sumQuantity1, SUM(weight) AS sumWeight1, SUM(boxCount) AS sumBoxCount1 FROM customer1";
    const sqlCustomer2 = "SELECT SUM(quantity) AS sumQuantity2, SUM(weight) AS sumWeight2, SUM(boxCount) AS sumBoxCount2 FROM customer2";

    // Helper function to execute a SQL query with a promise
    const executeQuery = (sql) => {
        return new Promise((resolve, reject) => {
            connection.query(sql, (error, result) => {
                if (error) {
                    console.error(error);
                    reject(error);
                } else {
                    resolve(result[0]);
                }
            });
        });
    };

    // Retrieve data for customer 1
    const promiseCustomer1 = executeQuery(sqlCustomer1);

    // Retrieve data for customer 2
    const promiseCustomer2 = executeQuery(sqlCustomer2);

    // Wait for both promises to resolve
    Promise.all([promiseCustomer1, promiseCustomer2])
        .then(([resultCustomer1, resultCustomer2]) => {
            // Convert the retrieved values from strings to numbers
            const sumQuantity1 = Number(resultCustomer1.sumQuantity1);
            const sumWeight1 = Number(resultCustomer1.sumWeight1);
            const sumBoxCount1 = Number(resultCustomer1.sumBoxCount1);
            const sumQuantity2 = Number(resultCustomer2.sumQuantity2);
            const sumWeight2 = Number(resultCustomer2.sumWeight2);
            const sumBoxCount2 = Number(resultCustomer2.sumBoxCount2);

            // Calculate the total values by summing the corresponding fields
            const total = {
                totalQuantity: sumQuantity1 + sumQuantity2,
                totalWeight: sumWeight1 + sumWeight2,
                totalBoxCount: sumBoxCount1 + sumBoxCount2
            };

            const data = {
                customer1: resultCustomer1,
                customer2: resultCustomer2,
                total: total
            };

            // Pass the data to the admin.ejs template
            resp.render('admin.ejs', { data });
        })
        .catch((error) => {
            console.error(error);
            resp.send("Error occurred while retrieving data.");
        });
});




app.post("/submit", function (req, resp) {
    const {
        orderDate,
        company,
        owner,
        item,
        quantity,
        weight,
        requestShipment,
        trackingID,
        shipmentSize,
        boxCount,
        specification,
        checklistQuantity
    } = req.body;

    let tableName; // variable to store the table name based on the company

    if (owner === 'Customer1'  || 'customer1' || 'customer 1' || 'Customer 1') {
        tableName = 'customer1'; // Replace 'customer1' with the actual table name for Customer 1
    } else if(owner === 'Customer2'  || 'customer2' || 'customer 2' || 'Customer 2') {
        tableName = 'customer2'; // Replace 'customer2' with the actual table name for Customer 2
    } else {
        resp.send('Invalid company');
        return;
    }

    // Execute SQL INSERT query to store the customer details
    const sql =
        `INSERT INTO ${tableName} (orderDate, company, owner, item, quantity, weight, requestShipment, trackingID, shipmentSize, boxCount, specification, checklistQuantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(
        sql,
        [
            orderDate,
            company,
            owner,
            item,
            quantity,
            weight,
            requestShipment,
            trackingID,
            shipmentSize,
            boxCount,
            specification,
            checklistQuantity
        ],
        function (error, result) {
            if (error) {
                // Handle the error
                console.error(error);
                // Provide appropriate feedback to the user
                resp.send("Error occurred while storing customer details.");
            } else {
                // Redirect to a success page or provide appropriate feedback to the user
                resp.send("Customer details stored successfully.");
            }
        }
    );
});




app.listen(PORT, ()=>{
    console.log(`Server is working on port ${PORT}`);
});
