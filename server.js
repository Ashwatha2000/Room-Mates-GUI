const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const cors = require('cors');
app.use(cors()); // Enable CORS for all requests

// Database configuration
const dbConfig = {
    user: 'sa',
    password: 'NewPassword123!',
    server: 'localhost',
    database: 'PROJECT',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Connect to the database
let poolPromise;
(async () => {
    try {
        const pool = await sql.connect(dbConfig);
        poolPromise = Promise.resolve(pool);
        console.log('Connected to the database!');
    } catch (err) {
        console.error('Database connection failed:', err);
    }
})();

// Route to insert a roommate
app.post('/add-roommate', async (req, res) => {
    try {
        const pool = await poolPromise;
        const query = `
            INSERT INTO Roommates 
            (Username, Password, FirstName, LastName, Email, Phone, DOB, Address, Gender, Languages, WorkExp, FoodHabit, CleanlinessHabit, CookingSkills, Hobbies, Personality)
            VALUES (@Username, @Password, @FirstName, @LastName, @Email, @Phone, @DOB, @Address, @Gender, @Languages, @WorkExp, @FoodHabit, @CleanlinessHabit, @CookingSkills, @Hobbies, @Personality)
        `;
        console.log('add-roomate:',query)
        const request = pool.request();
        for (const [key, value] of Object.entries(req.body)) {
            request.input(key, value);
        }
        await request.query(query);
        res.redirect('/page2.html');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error inserting record');
    }
});

// Route to get all roommates
app.get('/get-roommates', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT * FROM Roommates');
        console.log(result)
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching records');
    }
});

// Route to delete a roommate
app.delete('/delete-roommate/:id', async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('PersonID', req.params.id)
            .query('DELETE FROM Roommates WHERE PersonID = @PersonID');
        res.send('Record deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting record');
    }
});


// Route to update a roommate's record
app.put('/update-roommate/:id', async (req, res) => {
    const updatedData = req.body; // Expecting the full updated record from the request body
    console.log('Received data:', req.body);
    if (!updatedData) {
        return res.status(400).send('No data provided');
    }

    try {
        const pool = await poolPromise;
        const query = `
            UPDATE Roommates
            SET
                Username = @Username,
                Password = @Password,
                FirstName = @FirstName,
                LastName = @LastName,
                Email = @Email,
                Phone = @Phone,
                DOB = @DOB,
                Address = @Address,
                Gender = @Gender,
                Languages = @Languages,
                WorkExp = @WorkExp,
                FoodHabit = @FoodHabit,
                CleanlinessHabit = @CleanlinessHabit,
                CookingSkills = @CookingSkills,
                Hobbies = @Hobbies,
                Personality = @Personality
            WHERE PersonID = @PersonID
        `;
        console.log('server update query:', query )
        await pool.request()
            .input('PersonID', req.params.id)
            .input('Username', updatedData.Username)
            .input('Password', updatedData.Password)
            .input('FirstName', updatedData.FirstName)
            .input('LastName', updatedData.LastName)
            .input('Email', updatedData.Email)
            .input('Phone', updatedData.Phone)
            .input('DOB', updatedData.DOB)
            .input('Address', updatedData.Address)
            .input('Gender', updatedData.Gender)
            .input('Languages', updatedData.Languages)
            .input('WorkExp', updatedData.WorkExp)
            .input('FoodHabit', updatedData.FoodHabit)
            .input('CleanlinessHabit', updatedData.CleanlinessHabit)
            .input('CookingSkills', updatedData.CookingSkills)
            .input('Hobbies', updatedData.Hobbies)
            .input('Personality', updatedData.Personality)
            .query(query);

        res.send('Record updated successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating record');
    }
});



// Student login route
app.post('/student-login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Username and password are required.');
        }

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Username', username)
            .input('Password', password)
            .query(`
                SELECT * FROM Roommates 
                WHERE Username = @Username AND Password = @Password
            `);

        if (result.recordset.length > 0) {
            res.status(200).send('Login successful');
        } else {
            res.status(401).send('Invalid username or password.');
        }
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('An error occurred during login.');
    }
});

// Set preferences for roommates
app.post('/set-preferences', async (req, res) => {
    const preferences = req.body;

    // Assuming you have the PersonID of the logged-in user (e.g., via session or JWT)
    const personID = 1;  // Example; replace with the actual PersonID from the session or token

    try {
        // Connect to database
        const pool = await sql.connect(dbConfig);
        const query = `
            INSERT INTO Preferences (
                PersonID, RoomType, NoOfRoommates, ApartmentType, RentRange, 
                ApartmentArea, RoommateAge, RoommateCourse, RoommateGender, 
                RoommateFoodHabits, RoommateCleanlinessHabits, RoommateOtherDetails
            )
            VALUES (
                @PersonID, @RoomType, @NoOfRoommates, @ApartmentType, @RentRange, 
                @ApartmentArea, @RoommateAge, @RoommateCourse, @RoommateGender, 
                @RoommateFoodHabits, @RoommateCleanlinessHabits, @RoommateOtherDetails
            )`;

        await pool.request()
            .input('PersonID', sql.Int, personID)
            .input('RoomType', sql.VarChar, preferences.roomType)
            .input('NoOfRoommates', sql.Int, preferences.noOfRoommates)
            .input('ApartmentType', sql.VarChar, preferences.apartmentType)
            .input('RentRange', sql.VarChar, preferences.rentRange)
            .input('ApartmentArea', sql.Int, preferences.apartmentArea)
            .input('RoommateAge', sql.VarChar, preferences.roommateAge)
            .input('RoommateCourse', sql.VarChar, preferences.roommateCourse)
            .input('RoommateGender', sql.VarChar, preferences.roommateGender)
            .input('RoommateFoodHabits', sql.VarChar, preferences.roommateFoodHabits)
            .input('RoommateCleanlinessHabits', sql.VarChar, preferences.roommateCleanlinessHabits)
            .input('RoommateOtherDetails', sql.VarChar, preferences.roommateOtherDetails)
            .query(query);

        res.status(200).send({ message: 'Preferences saved successfully!' });

    } catch (error) {
        console.error('Error saving preferences:', error);
        res.status(500).send({ message: 'Failed to save preferences' });
    }
});


// Route to register broker
app.post('/register-broker', async (req, res) => {
    const { firstName, lastName, noOfProperties, contactMail, officeHours, noOfClients, licenseNumber, rating } = req.body;
    try {
        const pool = await poolPromise;

        // Insert into Owner table
        const result = await pool.request()
            .input('firstName', sql.VarChar, firstName)
            .input('lastName', sql.VarChar, lastName)
            .input('noOfProperties', sql.Int, noOfProperties)
            .input('contactMail', sql.VarChar, contactMail)
            .input('officeHours', sql.VarChar, officeHours)
            .query(`
                INSERT INTO Owner (FirstName, LastName, NoOfProperties, ContactMail, OfficeHours)
                VALUES (@firstName, @lastName, @noOfProperties, @contactMail, @officeHours);
                SELECT SCOPE_IDENTITY() AS OwnerID;
            `);

        // Retrieve the generated OwnerID using SCOPE_IDENTITY()
        const ownerID = result.recordset[0].OwnerID;

        // Insert into Broker table
        await pool.request()
            .input('ownerID', sql.Int, ownerID)
            .input('noOfClients', sql.Int, noOfClients)
            .input('licenseNumber', sql.VarChar, licenseNumber)
            .input('rating', sql.Int, rating)
            .query(`
                INSERT INTO Broker (OwnerID, NoOfClients, LicenseNumber, Rating)
                VALUES (@ownerID, @noOfClients, @licenseNumber, @rating);
            `);

        res.status(200).send({ message: 'Broker registered successfully!', ownerID: ownerID });
    } catch (error) {
        console.error('Error registering broker:', error);
        res.status(500).send('Error registering broker');
    }
});

// Route to register property manager
app.post('/register-property-manager', async (req, res) => {
    const { firstName, lastName, noOfProperties, contactMail, officeHours, noOfPropertiesManaged, ssn } = req.body;
    try {
        const pool = await poolPromise;

        // Insert into Owner table
        const result = await pool.request()
            .input('firstName', sql.VarChar, firstName)
            .input('lastName', sql.VarChar, lastName)
            .input('noOfProperties', sql.Int, noOfProperties)
            .input('contactMail', sql.VarChar, contactMail)
            .input('officeHours', sql.VarChar, officeHours)
            .query(`
                INSERT INTO Owner (FirstName, LastName, NoOfProperties, ContactMail, OfficeHours)
                VALUES (@firstName, @lastName, @noOfProperties, @contactMail, @officeHours);
                SELECT SCOPE_IDENTITY() AS OwnerID;
            `);

        // Retrieve the generated OwnerID using SCOPE_IDENTITY()
        const ownerID = result.recordset[0].OwnerID;

        // Insert into PropertyManager table
        await pool.request()
            .input('ownerID', sql.Int, ownerID)
            .input('noOfPropertiesManaged', sql.Int, noOfPropertiesManaged)
            .input('ssn', sql.VarChar, ssn)
            .query(`
                INSERT INTO PropertyManager (OwnerID, NoOfPropertiesManaged, SSN)
                VALUES (@ownerID, @noOfPropertiesManaged, @ssn);
            `);

        res.status(200).send({ message: 'Property Manager registered successfully!', ownerID: ownerID });
    } catch (error) {
        console.error('Error registering Property Manager:', error);
        res.status(500).send('Error registering Property Manager');
    }
});
app.get('/get-owner-details', async (req, res) => {
    const ownerID = req.query.ownerID;  // Get OwnerID from query string

    if (!ownerID) {
        return res.status(400).send('OwnerID is required');
    }

    try {
        const pool = await poolPromise;

        // Query to fetch owner details along with Broker or PropertyManager data
        const result = await pool.request()
            .input('ownerID', sql.Int, ownerID)
            .query(`
                SELECT o.OwnerID, o.FirstName, o.LastName, o.NoOfProperties, o.ContactMail, o.OfficeHours,
                    b.NoOfClients, b.LicenseNumber, b.Rating,
                    pm.NoOfPropertiesManaged, pm.SSN
                FROM Owner o
                LEFT JOIN Broker b ON o.OwnerID = b.OwnerID
                LEFT JOIN PropertyManager pm ON o.OwnerID = pm.OwnerID
                WHERE o.OwnerID = @ownerID
            `);

        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.status(404).send('Owner not found');
        }
    } catch (error) {
        console.error('Error fetching owner details:', error);
        res.status(500).send('Error fetching owner details');
    }
});





// Serve static files (HTML files)
app.use(express.static(__dirname));

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
