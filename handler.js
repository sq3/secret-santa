'use strict';

const AWS = require('aws-sdk');
const ses = new AWS.SES();

module.exports.secretSantaFunction = async (event) => {
  try {
    const body = JSON.parse(event.body || '');
    const participants = body.participants || [];
    const blacklist = body.blacklist || {};

    // Shuffle the participants to randomize the pairings
    const shuffledParticipants = shuffleArray(participants);

    // Generate pairs
    const pairs = [];
    const assignedReceivers = new Set();
    for (let i = 0; i < shuffledParticipants.length; i++) {
      console.log('Current Participant:', shuffledParticipants[i]);
      const giver = shuffledParticipants[i];
      let receiverIndex = (i + 1) % shuffledParticipants.length;

      while (giver.email === shuffledParticipants[receiverIndex].email ||
             (blacklist[giver.email] && blacklist[giver.email].includes(shuffledParticipants[receiverIndex].email)) ||
             assignedReceivers.has(shuffledParticipants[receiverIndex].email)) {
        receiverIndex = (receiverIndex + 1) % shuffledParticipants.length;
      }

      const receiver = shuffledParticipants[receiverIndex];
      assignedReceivers.add(receiver.email);
      pairs.push({
        giver: giver.name,
        giver_email: giver.email,
        receiver: receiver.name,
        receiver_email: receiver.email,
      });
    }

    // Send email notifications via SES
    for (const pair of pairs) {
      const subject = '🎅 Wichtel-Generator Notification 📣';
      const message = `Hey 👋 ${pair.giver}, dein Wichtel ist ${pair.receiver}. Frohe Weihnachten 🎄`;

      await ses.sendEmail({
        Destination: { ToAddresses: [pair.giver_email] },
        Message: {
          Body: { Text: { Data: message } },
          Subject: { Data: subject },
        },
        Source: 'secret-santa@mschnitzius.com', // Replace with your verified SES email
      }).promise();
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Secret Santa pairs created successfully', pairs }),
    };
  } catch (error) {
    console.error('Error creating Secret Santa pairs:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error creating Secret Santa pairs', error: String(error) }),
    };
  }
};

function shuffleArray(array) {
  // Fisher-Yates shuffle algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

