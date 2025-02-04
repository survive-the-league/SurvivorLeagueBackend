const express = require('express');
// const admin = require('firebase-admin');
const { admin, db } = require('./firebase');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const dotenv = require("dotenv")
const nodemailer = require("nodemailer");
const moment = require('moment-timezone');
const cron = require("node-cron")
const schedule = require('node-schedule');


dotenv.config()
// const serviceAccount = require('./serviceAccountKey.json');

const getCurrentMatchday = require('./getCurrentMatchday');
const getMatchdayResults = require('./getMatchdayResults');
const { cronJob } = require('./jobLogic');

// set up express app
const app = express();
const port = process.env.PORT || 8080;

// // Import the cron job logic
// const cron = require('node-cron');
// // cronJob function is imported from jobLogic.js
// const { cronJob } = require('./jobLogic');
 /** * Schedule the cron job to run every day at midnight. We are checking to see if the matchday has changed.
 * If it has, then we want to fetch the match results for the new matchday. Regardless, we want to update
 * the user's lives according to the match results and their predictions.
 */
cron.schedule('0 0 * * *', cronJob);
// cron.schedule('*/20 * * * * *', cronJob);
// // Run the cron job every minute for testing purposes
// cron.schedule('* * * * *', cronJob);

// Logic for Google Cloud Scheduler
// exports.scheduledCronJob = async (req, res) => {
//     try {
//         await cronJob();
//         res.status(200).send('Cron job successfully completed');
//     } catch (error) {
//         res.status(500).send('Error running cron job: ' + error.message);
//     }
// };

// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

const transporter = nodemailer.createTransport({
    service: "Gmail", // Use your email service provider
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });


    // Function to send emails
    const sendMatchEmail = (userEmail, match, name, matchDay) => {
        console.log("🚀 ~ sendMatchEmail ~ match:", match);
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: userEmail,
          subject: `Match Reminder for Matchweek ${matchDay} `,
          html: `
                    <html lang="en-US">
                <head>
                    <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
                    <title>Match Reminder</title>
                    <style type="text/css">
                    a:hover {
                        text-decoration: underline !important
                    }
                    </style>
                </head>
                <body margin="0" marginwidth="0" style="background-color:#f2f3f8">
                    <table cellspacing="0" border="0" cellpadding="0" width="100%" bgcolor="#f2f3f8" style="@import url(https://fonts.googleapis.com/css?family=Rubik:300,400,500,700|Open+Sans:300,400,600,700);font-family:'Open Sans',sans-serif">
                        <tr>
                            <td>
                                <table style="background-color:#f8fafc;max-width:1200px;margin:0 auto;margin-top:5px" width="100%" border="0" align="center" cellpadding="0" cellspacing="0">
                                    
                                    <tr>
                                        <td style="height:30px">&nbsp;</td>
                                    </tr>
                            <tr>
                            <td>
                                <table width="95%" border="0" align="center" cellpadding="0" cellspacing="0" style="max-width:670px;background:#fff;border-radius:3px;text-align:left;-webkit-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);-moz-box-shadow:0 6px 18px 0 rgba(0,0,0,.06);box-shadow:0 6px 18px 0 rgba(0,0,0,.06)">
                                <tr>
                                    <td style="height:40px">&nbsp;</td>
                                </tr>
                                <tr>
                                    <td style="padding:0 35px">
                                    <p style="color:#18181b;font-size:15px;line-height:24px;margin:0;margin-bottom:20px">Hi ${name},</p>
                                    <p style="color:#18181b;font-size:15px;line-height:24px;margin:0;margin-bottom:20px">The deadline to make a selection for Matchweek <strong>${matchDay}</strong> is tomorrow at <strong>${moment.utc(match).tz('America/New_York').format('hh:mm A z')}</strong>. don't forget to make your pick.</p>
                                    <p style="color:#18181b;font-size:15px;line-height:24px;margin:0;margin-bottom:20px">To make your selections, please log in to your account using the button below:</p>
                                    <div style="text-align:center;">
                                    <a href="${process.env.FRONT_END_WEBSITE_URL}" style="background:#5460f3;text-decoration:none!important;display:inline-block;font-weight:600;margin-top:10px;color:#fff !important;text-transform:uppercase;font-size:18px;padding:15px 60px;display:inline-block;border-radius:50px;margin-bottom:25px;text-align:center;cursor:pointer;">Login </a>
                                    </div>
                                    <p style="color:#18181b;font-size:15px;line-height:24px;margin:0">Best regards,</p>
                                    <p style="color:#18181b;font-size:15px;line-height:24px;margin:0">The Survivorleague Team</p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="height:40px">&nbsp;</td>
                                </tr>
                                </table>
                            </td>
                            <tr>
                            <td style="height:30px">&nbsp;</td>
                            </tr>
                        </table>
                        </td>
                    </tr>
                    </table>
                </body>
                </html>
  `,
        };
      
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Error sending email:", error);
          } else {
            console.log('Email sent: ' + info.response);
          }
        });
      };

  // Function to fetch current matchday
  const fetchMatchesByDate = async (matchday) => {
    try {
        const response = await axios.get(`https://api.football-data.org/v4/competitions/PL/matches`, {
            headers: {
                "X-Auth-Token": process.env.FOOTBALL_DATA_API_KEY,
            },
            params: {
                matchday: matchday,
            },
        });

        const { resultSet, matches } = response.data;

        const filteredResponse = {
            startDate: resultSet.first,
            endDate: resultSet.last,
            firstMatch: matches.length > 0 ? matches[0].utcDate : null, // Only include the first match if it exists
        };

        return filteredResponse;
    } catch (error) {
        console.error("Error fetching matches for date:", error.message);
        return [];
    }
};



const scheduleReminders = async (matchData, users, matchDay) => {
    const { startDate, firstMatch } = matchData;
    console.log("🚀 ~ scheduleReminders ~ startDate:", startDate);
    console.log("🚀 ~ scheduleReminders ~ firstMatch:", moment(firstMatch).format("DD-MM-YYYY hh:mm A z"),firstMatch);
    
    // Get the current date and add one day in EST
    const currentDatePlusOne = moment().tz('America/New_York').add(1, 'days').format('YYYY-MM-DD');
    console.log("🚀 ~ scheduleReminders ~ currentDatePlusOne:", currentDatePlusOne);
    
    // Check if currentDate + 1 matches startDate
    if (currentDatePlusOne === startDate) {
        console.log("✅ Condition met: Scheduling reminder.");
        
        // Calculate the reminder time (24 hours before firstMatch) in EST
        const reminderTime = moment.utc(firstMatch).tz('America/New_York').subtract(1, 'days');
        console.log("🚀 ~ scheduleReminders ~ reminderTime (EST):", reminderTime.format());

        const reminderDate = reminderTime.toDate();
        console.log("🚀 ~ scheduleReminders ~ Final Reminder Date:", reminderDate);


        if (reminderDate <= new Date()) {
            console.error("❌ Error: Reminder time is in the past. Skipping job scheduling.");
            return;
        }
            
            // Schedule the job
            schedule.scheduleJob(reminderDate, () => {
                console.log("🚀 Reminder job triggered at:", new Date());
    
                if (Array.isArray(users) && users.length > 0) {
                    users.forEach(user => {
                        console.log(`📧 Mail is scheduled for user: ${user.userName}`);
                        sendMatchEmail(user.email, firstMatch, user.userName, matchDay);
                    });
                } else {
                    console.log("⚠️ No users to send email to.");
                }
            });
        
    } else {
        console.log("Condition not met: currentDate + 1 does not match startDate. No reminders scheduled.");
    }
};









// Fetch users with valid leagues
const fetchUsersWithLives = async () => {
    const usersCollection = await db.collection("usernames").get();

    const users = await Promise.all(usersCollection.docs.map(async (doc) => {
        const userId = doc.id;
        const userData = doc.data();

        const leaguesCollection = await db.collection(`users/${userId}/leagues`).get();
        const leagues = leaguesCollection.docs.map(leagueDoc => leagueDoc.data());

        const hasLives = leagues.some(league => league.lives > 0);
        return hasLives ? { id: userId, email: userData.email, userName: userData.username } : null;
    }));

    return users.filter(user => user !== null);

};


const scheduleRemindersForNextDay = async () => {
    try {
        const currentMatchday = await getCurrentMatchday();
        const matches = await fetchMatchesByDate(currentMatchday);
        const users = await fetchUsersWithLives();
        if (users.length === 0) {
            console.log("No users to send reminders to.");
            return;
        }

        await scheduleReminders(matches, users, currentMatchday);
    } catch (error) {
        console.error("Error scheduling reminders:", error);
    }
};

// Schedule the function to run every day at 00:01
cron.schedule('1 0 * * *', async () => {
    console.log("Running scheduled reminders task...");
    await scheduleRemindersForNextDay();
});

// Automatically invoke this function when the server restarts to ensure any previously scheduled mails 
// are rescheduled for the next day. This helps maintain consistency and avoids missing any scheduled reminders.
scheduleRemindersForNextDay();

  

app.use(cors());
app.use(bodyParser.json());

app.post('/scheduledCronJob', async (req, res) => {
    await cronJob();
    res.status(200).send('Cron job successfully completed');
});

/**
 *  An axios.post request is a method provided by the Axios library in JavaScript to make 
    HTTP POST requests. Axios is a promise-based HTTP client for the browser and Node.js that 
    makes it easy to send asynchronous HTTP requests to REST endpoints and perform CRUD operations.
 */
app.post('/makePredictions', async (req, res) => {
    const { userId, leagueId, matchday, teamId, username } = req.body;

    try {
        // Create a reference to the prediction document in Firestore
        const predictionRef = db.collection('predictions').doc();

        // Save the prediction to Firestore database
        await predictionRef.set({
            id: predictionRef.id,
            userId: userId,
            leagueId: leagueId,
            matchday: matchday,
            teamId: teamId,
            username: username,
            predictionOutcome: "DEFAULT",
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).send('Prediction successfully saved');
    } catch (error) {
        res.status(500).send('Error saving prediction' + error.message);;
    }
});

/**
 * Function to save match results to Firestore database.
 * @param {*} matchResults match data to save to Firestore database.
 */
const saveMatchResults = async (matchResults) => {
    for (const match of matchResults) {
        // Create a reference to the match document in Firestore
        const matchRef = db.collection('matches').doc(match.id.toString());

        // Save match results for a given matchday to Firestore database
        await matchRef.set({
            id: match.id,
            homeTeam: match.homeTeam.name,
            awayTeam: match.awayTeam.name,
            score: match.score.fullTime,
            utcDate: match.utcDate,
            matchday: match.matchday,
            winner: match.score.winner,
            status: match.status,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });
    }
};

/**
 *  ENDPOINT: Fetch match results for a GIVEN matchday from Football Data API and save them to Firestore database.
*/
app.get('/fetchMatchdayResults/:matchday', async (req, res) => {
    const matchday = req.params.matchday;
    try {
        const matchResults = await getMatchdayResults(matchday);
        await saveMatchResults(matchResults);
        res.status(200).json(matchResults);
    } catch (error) {
        res.status(500).send('Error fetching matchday results: ' + error.message);
    }
});

/**
 * ENDPOINT: Fetch current matchday from Football Data API.
 */
app.get('/fetchCurrentMatchday', async (req, res) => {
    try {
        const response = await axios.get('https://api.football-data.org/v4/competitions/PL', {
            headers: {
                'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY
            }
        });
        // Extract current matchday from the response
        const currentMatchday = response.data.currentSeason.currentMatchday;
        res.status(200).json({ currentMatchday: currentMatchday });
    } catch (error) {
        res.status(500).send('Error fetching current matchday: ' + error.message);
    }
});

/**
 * ENDPOINT: Fetch CURRENT matchday results from Football Data API and save them to Firestore database.
 */
app.get('/fetchCurrentMatchdayResults', async (req, res) => {
    try {
        const currentMatchday = await getCurrentMatchday();
        const matchResults = await getMatchdayResults(currentMatchday);
        await saveMatchResults(matchResults);
        res.status(200).send('Matchday results successfully saved');
    } catch (error) {
        res.status(500).send('Error fetching current matchday results: ' + error.message);
    }
});

/**
 * ENDPOINT: Fetch all teams in the BPL this year from the Football Data API. But, first, 
 * check if the teams are already in the Firestore database.
 */
app.get('/fetchTeams', async (req, res) => {
    try {
        // Fetch all teams from Firestore database
        const teamsSnapshot = await db.collection('teams').get();
        let teamsList = [];
        // Add each team to the teamsList array
        teamsSnapshot.forEach(doc => {
            teamsList.push(doc.data());
        });

        // If no teams are found in the Firestore database, fetch them from the Football Data API
        if (teamsList.length === 0) {
            const response = await axios.get('https://api.football-data.org/v4/competitions/PL/teams', {
                headers: {
                    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY
                }
            });
            // Map the response data to the teamsList array
            teamsList = response.data.teams.map(team => ({
                team: team.id, 
                name: team.name
            }));
        }
        // Save the teams to Firestore database
        const batch = db.batch();
        // For each team in the teamsList array, create a reference to the team document in Firestore
        teamsList.forEach(team => {
            const teamRef = db.collection('teams').doc(team.name.toString());
            batch.set(teamRef, team);
        });
        // Commit the batch write to Firestore database
        await batch.commit();
        res.status(200).json(teamsList);
    } catch (error) {
        res.status(500).send('Error fetching teams: ' + error.message);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
});